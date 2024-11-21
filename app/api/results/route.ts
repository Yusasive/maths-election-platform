import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const MONGODB_URI = process.env.MONGODB_URI as string;
const DATABASE_NAME = process.env.MONGODB_DB_NAME as string;

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  try {
    if (!cachedClient) {
      console.log("Connecting to MongoDB...");
      cachedClient = await MongoClient.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 2000,
      });
    }
    return cachedClient.db(DATABASE_NAME);
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("Failed to connect to MongoDB:", errorMessage);
    throw new Error(
      "Unable to connect to the database. Please check your connection settings."
    );
  }
}

export async function GET() {
  try {
    const db = await connectToDatabase();
    const votesCollection = db.collection("votes");

    const votes = await votesCollection
      .find({}, { projection: { matricNumber: 1, votes: 1, timestamp: 1 } })
      .toArray();

    const transformedVotes = votes.map((vote) => ({
      matricNumber: vote.matricNumber,
      votes: vote.votes,
      timestamp: vote.timestamp,
    }));

    return NextResponse.json(transformedVotes, { status: 200 });
  } catch (error) {
    console.error("Error fetching votes:", error);
    return NextResponse.json(
      { message: "Error fetching votes" },
      { status: 500 }
    );
  }
}
