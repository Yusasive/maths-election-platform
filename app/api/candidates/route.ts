import { NextResponse } from "next/server";

const candidatesData = [
  {
    "position": "Social Director",
    "allowMultiple": false,
    "candidates": [
      {
        "id": 1,
        "name": "Akeeb Abubakr Busayo",
        "level": "400L",
        "imageUrl": "/akeeb.jpg"
      }
    ]
  },

  {
    "position": "Student Representative Councils {SRC}",
    "allowMultiple": true,
    "candidates": [
      {
        "id": 1,
        "name": "Alabi Sodiq Olaniyi",
        "level": "400L",
        "imageUrl": "/alabi.jpg"
      },
      {
        "id": 2,
        "name": "Taiwo Nicole Ifeoluwa",
        "level": "400L",
        "imageUrl": "/taiwo.jpg"
      },
      {
        "id": 3,
        "name": "Anifowose Precious Oluwatunmise",
        "level": "300L",
        "imageUrl": "/anifowo.jpg"
      },
      {
        "id": 4,
        "name": "Oluwatoyin Matias Damilare",
        "level": "300L",
        "imageUrl": "/oluwatoyin.jpg"
      },
      {
        "id": 5,
        "name": "Convenant Nwafor",
        "level": "200L",
        "imageUrl": "/convenat.jpg"
      },
      {
        "id": 6,
        "name": "Adefila Oluwapelumi Adedayo",
        "level": "200L",
        "imageUrl": "/adefila.jpg"
      },
      {
        "id": 7,
        "name": "Abeeb Ayinla Raji",
        "level": "100L",
        "imageUrl": "/abeeb.jpg"
      },
      {
        "id": 8,
        "name": "Okeowo Abdullateef Opemipo",
        "level": "100L",
        "imageUrl": "/okeowo.jpg"
      },
      {
        "id": 9,
        "name": "Oloto Israel Okasime",
        "level": "100L",
        "imageUrl": "/oloto.jpg"
      },
      {
        "id": 10,
        "name": "Hamzat Aliyah Amoke",
        "level": "100L",
        "imageUrl": "/hamzat.jpg"
      }
    ]
  }
];
export async function GET() {
  return NextResponse.json(candidatesData);
}
