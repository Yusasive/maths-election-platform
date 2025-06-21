import { NextResponse } from "next/server";

const candidatesData = [
  {
    position: "Presdient",
    allowMultiple: false,
    candidates: [
      {
        id: 1,
        name: "Iyanda Demilade James",
        level: "300L",
        imageUrl: "/iyanda.jpg",
      },
    ],
  },
  {
    position: "Vice President",
    allowMultiple: false,
    candidates: [
      {
        id: 2,
        name: "Saheed Rofiat",
        level: "300L",
        imageUrl: "/maths.png",
      },
    ],
  },
  {
    position: "General Secretary",
    allowMultiple: false,
    candidates: [
      {
        id: 3,
        name: "Simeon Oluwadunsin Deborah",
        level: "300L",
        imageUrl: "/maths.png",
      },
    ],
  },
  {
    position: "Welfare Secretary",
    allowMultiple: false,
    candidates: [
      {
        id: 4,
        name: "Akewusola Babatunde Adewale",
        level: "200L",
        imageUrl: "/maths.png",
      },
    ],
  },
  {
    position: "Sport Director",
    allowMultiple: false,
    candidates: [
      {
        id: 5,
        name: "Tiamiyu Abiodun Jemil",
        level: "300L",
        imageUrl: "/maths.png",
      },
    ],
  },
  {
    position: "Financial Secretary",
    allowMultiple: false,
    candidates: [
      {
        id: 6,
        name: "Sanusi Adeola Abraham",
        level: "300L",
        imageUrl: "/maths.png",
      },
    ],
  },
  {
    position: "Public Relations Officer {PRO}",
    allowMultiple: false,
    candidates: [
      {
        id: 7,
        name: "Bello Basit Korede",
        level: "300L",
        imageUrl: "/basit.jpg",
      },
    ],
  },
  {
    position: "Student Representative Councils {SRC}",
    allowMultiple: true,
    candidates: [
      {
        id: 8,
        name: "Idris Aliyah Olajumoke",
        level: "300L",
        imageUrl: "/aliyah.jpg",
      },
      {
        id: 9,
        name: "Ajibola Iyanu Precious",
        level: "200L",
        imageUrl: "/maths.png",
      },
      {
        id: 10,
        name: "Oluwadunsin Silvanus O.",
        level: "100L",
        imageUrl: "/maths.png",
      },
    ],
  },
];
export async function GET() {
  return NextResponse.json(candidatesData);
}
