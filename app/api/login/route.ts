import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const DB_NAME = "votingApp";
const COLLECTION_NAME = "users";
export async function POST(request: Request) {
  try {
    const { matricNumber, fullName, department, image } = await request.json();

    if (!matricNumber || !fullName || !department || !image) {
      return NextResponse.json(
        { error: "All fields (matricNumber, fullName, department, image) are required" },
        { status: 400 }
      );
    }

    const normalizedMatricNumber = matricNumber.trim().toLowerCase();

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    const existingUser = await collection.findOne({
      matricNumber: normalizedMatricNumber,
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "You have already registered or voted." },
        { status: 400 }
      );
    }

    const newUser = {
      matricNumber: normalizedMatricNumber,
      fullName,
      department,
      image,
      voterData: false, 
      createdAt: new Date(), 
    };

    const result = await collection.insertOne(newUser);

    if (result.acknowledged) {
      return NextResponse.json(
        { message: "Registration successful!", userId: result.insertedId },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to register user" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error during registration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
