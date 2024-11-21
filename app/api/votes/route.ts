import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB_NAME as string;

let cachedClient: MongoClient | null = null;

export async function POST(req: Request) {
  try {
    const body = await req.json(); 
    const { matricNumber, votes } = body;

    if (!matricNumber || !votes) {
      return NextResponse.json({ message: "Invalid input data." }, { status: 400 });
    }

    if (!cachedClient) {
      cachedClient = await MongoClient.connect(uri);
    }
    const db = cachedClient.db(dbName);

    const result = await db.collection("votes").insertOne({
      matricNumber,
      votes,
      timestamp: new Date(),
    });

    return NextResponse.json({ message: "Vote successfully recorded.", result }, { status: 201 });
  } catch (error) {
    console.error("Error saving vote:", error);
    return NextResponse.json({ message: "Failed to save the vote." }, { status: 500 });
  }
}
