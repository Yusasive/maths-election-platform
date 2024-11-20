import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  const { matricNumber, fullName, department, image } = await request.json();

  if (!matricNumber || !fullName || !department || !image) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db("votingApp");
    const collection = db.collection("users");

    // Check for duplicate matric number
    const existingUser = await collection.findOne({ matricNumber });

    if (existingUser) {
      return NextResponse.json(
        { error: "Matric number is already registered" },
        { status: 400 }
      );
    }

    // Insert user into the database
    await collection.insertOne({
      matricNumber,
      fullName,
      department,
      image,
      hasVoted: false,
    });

    return NextResponse.json({ message: "Login successful!" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
