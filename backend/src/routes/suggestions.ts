import { Router } from "express";
import { Prisma } from "@prisma/client";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middlewares/auth";
import { logActivity } from "../services/activity.service";
import prisma from "../middlewares/prismaSoftDelete";

// Extend the Request type to include user and query params
type SuggestionRequest = AuthRequest & {
  query: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PURCHASED';
    sortBy?: 'votes' | 'createdAt' | 'title' | 'author';
    order?: 'asc' | 'desc';
  };
  params: {
    id?: string;
  };
  body: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PURCHASED';
    title?: string;
    author?: string;
    reason?: string;
  };
};

type SuggestionWithVotes = Prisma.SuggestionGetPayload<{
  include: {
    user: { select: { name: true; email: true } };
    votes: true;
  };
}>;

const router = Router();

// Extend the Prisma client to include the Vote model
interface PrismaClientWithVotes extends Omit<typeof prisma, 'vote'> {
  vote: {
    count: (args: { where: { suggestionId: number } }) => Promise<number>;
    findFirst: (args: { where: { suggestionId: number; userId: number } }) => Promise<{ id: number } | null>;
    delete: (args: { where: { id: number } }) => Promise<void>;
    create: (args: { data: { suggestionId: number; userId: number } }) => Promise<void>;
  };
}

const prismaWithVotes = prisma as unknown as PrismaClientWithVotes;

// BigInt serializer to handle large numbers in JSON responses
const serializeBigInt = (obj: any): any => {
  if (typeof obj === 'bigint') {
    return obj.toString();
  } else if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  } else if (obj !== null && typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const key in obj) {
      result[key] = serializeBigInt(obj[key]);
    }
    return result;
  }
  return obj;
};

// Get all suggestions (accessible to all authenticated users)
router.get("/", authMiddleware, async (req: SuggestionRequest, res) => {
  try {
    const { status, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    // First get all non-deleted suggestions with user info and vote counts
    const suggestions = await prismaWithVotes.suggestion.findMany({
      where: {
        ...(status ? { status } : {})
      } as any, // Temporary any to bypass type checking until we regenerate Prisma client
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        votes: true
      },
      orderBy: sortBy === 'votes' 
        ? {
            votes: {
              _count: order.toLowerCase() as 'asc' | 'desc'
            }
          }
        : {
            [sortBy]: order.toLowerCase()
          }
    });
    
    // Format the response with vote count
    const suggestionsWithVoteCount = suggestions.map(suggestion => ({
      ...suggestion,
      userName: suggestion.user?.name,
      userEmail: suggestion.user?.email,
      voteCount: suggestion.votes?.length || 0
    }));

    res.json(suggestionsWithVoteCount);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

// Create a new suggestion
router.post("/", authMiddleware, async (req: SuggestionRequest, res) => {
  const { title, author, reason } = req.body;
  const userId = req.user!.id;

  if (!title || !author) {
    return res.status(400).json({ error: "Title and author are required" });
  }

  try {
    // Check for duplicate suggestion (case insensitive) using raw SQL
    const existingSuggestions = await prisma.$queryRaw`
      SELECT id, title, author, status
      FROM Suggestion
      WHERE LOWER(title) = LOWER(${title})
        AND LOWER(author) = LOWER(${author})
        AND status != 'REJECTED'
    `;

    if (Array.isArray(existingSuggestions) && existingSuggestions.length > 0) {
      return res.status(400).json({ 
        error: "This book has already been suggested",
        suggestion: existingSuggestions[0]
      });
    }

    // Create a new suggestion with the status using raw SQL
    const result = await prisma.$transaction(async (tx: any) => {
      // First, insert the suggestion
      await tx.$executeRaw`
        INSERT INTO Suggestion (title, author, reason, userId, status, createdAt, updatedAt)
        VALUES (${title}, ${author}, ${reason || null}, ${userId}, 'PENDING', NOW(), NOW())
      `;
      
      // Then get the inserted suggestion with user info
      const suggestions = await tx.$queryRaw`
        SELECT 
          s.*, 
          u.name as userName,
          u.email as userEmail,
          0 as voteCount
        FROM Suggestion s
        JOIN User u ON s.userId = u.id
        WHERE s.title = ${title} 
          AND s.author = ${author} 
          AND s.userId = ${userId}
        ORDER BY s.id DESC
        LIMIT 1
      `;
      
      return suggestions;
    });
    
    // Handle the result safely
    const suggestion = Array.isArray(result) ? result[0] : null;
    if (!suggestion) {
      throw new Error('Failed to create suggestion');
    }
    
    const suggestionWithVoteCount = {
      ...suggestion,
      user: {
        name: suggestion.userName,
        email: suggestion.userEmail
      },
      votes: [],
      voteCount: 0
    };

    // Log activity with book title and author
    await logActivity(
      'SUGGESTION',
      userId,
      undefined,
      title,
      `New book suggestion: "${title}" by ${author}`
    );

    res.status(201).json(suggestionWithVoteCount);
  } catch (error) {
    console.error("Error creating suggestion:", error);
    res.status(500).json({ error: "Failed to create suggestion" });
  }
});

// Vote for a suggestion
router.post("/:id/vote", authMiddleware, async (req: SuggestionRequest, res) => {
  const suggestionId = parseInt(req.params.id!);
  const userId = req.user!.id;

  try {
    // Check if suggestion exists (soft delete is handled by middleware)
    const suggestion = await prismaWithVotes.suggestion.findUnique({
      where: { id: suggestionId }
    });

    if (!suggestion) {
      return res.status(404).json({ error: "Suggestion not found" });
    }

    // Check if user already voted
    const existingVote = await prismaWithVotes.vote.findFirst({
      where: {
        suggestionId,
        userId
      }
    });

    if (existingVote) {
      // Remove vote if already voted
      await prismaWithVotes.vote.delete({
        where: { id: existingVote.id }
      });
      return res.json({ voted: false });
    }

    // Add vote
    await prismaWithVotes.vote.create({
      data: {
        suggestionId,
        userId
      }
    });

    res.json({ voted: true });
  } catch (error) {
    console.error("Error voting for suggestion:", error);
    res.status(500).json({ error: "Failed to process vote" });
  }
});

// Update suggestion status (admin only)
router.patch("/:id/status", authMiddleware, adminMiddleware, async (req: SuggestionRequest, res) => {
  const { status } = req.body;
  const suggestionId = parseInt(req.params.id!);

  if (!status || !['PENDING', 'APPROVED', 'REJECTED', 'PURCHASED'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    // First get the suggestion to log activity
    const existingSuggestion = await prismaWithVotes.suggestion.findUnique({
      where: { id: suggestionId },
      select: { title: true, author: true }
    });

    if (!existingSuggestion) {
      return res.status(404).json({ error: "Suggestion not found" });
    }

    // Update the suggestion status using raw query to avoid type issues
    const updatedSuggestion = await prismaWithVotes.$executeRaw`
      UPDATE Suggestion 
      SET status = ${status}, updatedAt = NOW() 
      WHERE id = ${suggestionId}
    `;
    
    // Fetch the updated suggestion
    const updated = await prismaWithVotes.suggestion.findUnique({
      where: { id: suggestionId }
    });
    
    // Fetch the updated suggestion with user data
    const suggestionWithUser = await prismaWithVotes.suggestion.findUnique({
      where: { id: suggestionId },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!suggestionWithUser) {
      return res.status(404).json({ error: "Failed to fetch updated suggestion" });
    }

    // Get the vote count
    const voteCount = await prismaWithVotes.vote.count({
      where: {
        suggestionId
      }
    });

    // Create a new object with the vote count
    const updatedSuggestionWithVoteCount = {
      ...suggestionWithUser,
      voteCount: voteCount
    };

        // Get the full suggestion with author
    const fullSuggestion = await prismaWithVotes.suggestion.findUnique({
      where: { id: suggestionId },
      select: { title: true, author: true }
    });

    // Log activity with book title and author
    await logActivity(
      'SUGGESTION',
      req.user!.id,
      undefined,
      existingSuggestion.title,
      `Suggestion marked as ${status}: "${existingSuggestion.title}" by ${fullSuggestion?.author || 'Unknown Author'}`
    );

    res.json(updatedSuggestionWithVoteCount);
  } catch (error) {
    console.error("Error updating suggestion status:", error);
    res.status(500).json({ error: "Failed to update suggestion status" });
  }
});

// Delete a suggestion (admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req: SuggestionRequest, res) => {
  const suggestionId = parseInt(req.params.id!);

  try {
    // Get the suggestion details before soft deleting
    const suggestion = await prisma.suggestion.findUnique({
      where: { id: suggestionId },
      select: { 
        id: true, 
        title: true, 
        status: true,
        author: true
      }
    });

    if (!suggestion) {
      return res.status(404).json({ error: "Suggestion not found" });
    }

    // Soft delete the suggestion (the middleware will handle this)
    // This will trigger our soft delete middleware
    await prismaWithVotes.suggestion.delete({
      where: { id: suggestionId }
    });

    // Log the deletion activity with book title and author
    await logActivity(
      'SUGGESTION',
      req.user!.id,
      undefined,
      suggestion.title,
      `Suggestion deleted (was ${suggestion.status}): "${suggestion.title}" by ${suggestion.author || 'Unknown Author'}`
    );

    res.json({ 
      success: true,
      message: 'Suggestion has been soft deleted',
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error deleting suggestion:", error);
    res.status(500).json({ error: "Failed to delete suggestion" });
  }
});

export default router;
