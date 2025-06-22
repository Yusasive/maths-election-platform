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
        name: "Saheed Rofiat Ayomide",
        level: "300L",
        imageUrl: "/sah.jpg",
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
        imageUrl: "/olu.jpg",
      },
    ],
  },
  {
    position: "Assist. General Secretary",
    allowMultiple: false,
    candidates: [
      {
        id: 4,
        name: "Elijah Esther",
        level: "100L",
        imageUrl: "/ali.jpg",
      },
    ],
  },
  {
    position: "Welfare Secretary",
    allowMultiple: false,
    candidates: [
      {
        id: 5,
        name: "Akewusola Babatunde Adewale",
        level: "200L",
        imageUrl: "/bab.jpg",
      },
    ],
  },
  {
    position: "Sport Director",
    allowMultiple: false,
    candidates: [
      {
        id: 6,
        name: "Tiamiyu Abiodun Jemil",
        level: "300L",
        imageUrl: "/tia.jpg",
      },
    ],
  },
  {
    position: "Financial Secretary",
    allowMultiple: false,
    candidates: [
      {
        id: 7,
        name: "Sanusi Adeola Abraham",
        level: "300L",
        imageUrl: "/san.jpg",
      },
    ],
  },
  {
    position: "Public Relations Officer {PRO}",
    allowMultiple: false,
    candidates: [
      {
        id: 8,
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
        id: 9,
        name: "Idris Aliyah Olajumoke",
        level: "300L",
        imageUrl: "/aliyah.jpg",
      },
      {
        id: 10,
        name: "Abdurraheem Ramadhan ",
        level: "300L",
        imageUrl: "/ram.jpg",
      },
      {
        id: 11,
        name: "Ajibola Iyanu Precious",
        level: "200L",
        imageUrl: "/aji.jpg",
      },
      {
        id: 12,
        name: "Oluwadunsin Silvanus O.",
        level: "200L",
        imageUrl: "/sil.jpg",
      },
      {
        id: 13,
        name: "Bakare Micheal Olamide",
        level: "100L",
        imageUrl: "/bak.jpg",
      },
      {
        id: 14,
        name: "Adefila Oluwapelumi Adedayo",
        level: "100L",
        imageUrl: "/ade.jpg",
      },
    ],
  },
];
export async function GET() {
  return NextResponse.json(candidatesData);
}
