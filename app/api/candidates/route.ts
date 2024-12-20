import { NextResponse } from "next/server";

// Mocked data (replace this with a database call if necessary)
const candidatesData = [
  {
    position: "Sport Secretary",
    allowMultiple: false,
    candidates: [
      { id: 1, name: "Olabamidele Oluwadamilola E.", level: "400L", imageUrl: "/dammy.jpg" },
    ],
  },
  {
    position: "Social Secretary",
    allowMultiple: false,
    candidates: [
      { id: 2, name: "Igbinedion Elijah Itobere", level: "300L", imageUrl: "/elijah.jpg" },
    ],
  },
  {
    position: "Public Relations Officer {PRO}",
    allowMultiple: false,
    candidates: [
      { id: 3, name: "Iyanda Demilade James", level: "300L", imageUrl: "/iyanda.jpg" },
      { id: 4, name: "Bello Basit Korede", level: "200L", imageUrl: "/basit.jpg" },
    ],
  },
  {
    position: "Student Representative Councils {SRC}",
    allowMultiple: true,
    candidates: [
      { id: 5, name: "Idris Aliyah Olajumoke", level: "300L", imageUrl: "/aliyah.jpg" },
      { id: 6, name: "Agbaje Oluwaseun David", level: "100L", imageUrl: "/agbaje.jpg" },
      { id: 7, name: "Bakare Micheal Olamide", level: "100L", imageUrl: "/maths.png" },
    ],
  },
];

// Exporting GET handler for App Router
export async function GET() {
  return NextResponse.json(candidatesData);
}
