import { render, screen, fireEvent, act } from "@testing-library/react";
import VotingPage from "@/app/page"; // Adjust the import path as necessary
import { useNotification } from "@/context/NotificationContext";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />, // Mock Next.js Image
}));

jest.mock("@/context/NotificationContext", () => ({
  useNotification: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

describe("VotingPage", () => {
  const mockAddNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });

    localStorage.clear();
  });

  test("redirects if voter data is missing", () => {
    const obj: { [key: string]: any } = {
      location: window.location,
    };

    delete obj.location;

    render(<VotingPage />);

    expect(mockAddNotification).toHaveBeenCalledWith(
      "error",
      "You must log in first!"
    );
    expect(window.location.href).toBe("/");
  });

  test("redirects if voter has already voted", () => {
    localStorage.setItem(
      "mathsVoterData",
      JSON.stringify({ matricNumber: "123" })
    );
    localStorage.setItem("mathsVoteRecord", JSON.stringify({}));
    const obj: { [key: string]: any } = {
      location: window.location,
    };

    delete obj.location;

    render(<VotingPage />);

    expect(mockAddNotification).toHaveBeenCalledWith(
      "warning",
      "You have already voted!"
    );
    expect(window.location.href).toBe("/");
  });

  test("renders countdown timers correctly", () => {
    process.env.NEXT_PUBLIC_LOGIN_END_TIME = new Date(
      Date.now() + 3600000
    ).toISOString(); // 1 hour
    process.env.NEXT_PUBLIC_VOTING_END_TIME = new Date(
      Date.now() + 7200000
    ).toISOString(); // 2 hours

    localStorage.setItem(
      "mathsVoterData",
      JSON.stringify({ matricNumber: "123" })
    );

    render(<VotingPage />);

    expect(screen.getByText(/Login Time Left:/)).toBeInTheDocument();
    expect(screen.getByText(/Voting Time Left:/)).toBeInTheDocument();
  });

  test("handles candidate selection (single choice)", () => {
    const mockCandidates = [
      {
        position: "President",
        allowMultiple: false,
        candidates: [
          { id: 1, name: "John Doe", level: "Senior", imageUrl: "test.jpg" },
          { id: 2, name: "Jane Doe", level: "Junior", imageUrl: "test2.jpg" },
        ],
      },
    ];
    jest.mock("../../data/candidates.json", () => mockCandidates);

    localStorage.setItem(
      "mathsVoterData",
      JSON.stringify({ matricNumber: "123" })
    );

    render(<VotingPage />);

    const radio1 = screen.getByLabelText("John Doe");
    const radio2 = screen.getByLabelText("Jane Doe");

    fireEvent.click(radio1);
    expect(radio1).toBeChecked();
    expect(radio2).not.toBeChecked();

    fireEvent.click(radio2);
    expect(radio2).toBeChecked();
    expect(radio1).not.toBeChecked();
  });

  test("handles candidate selection (multiple choice)", () => {
    const mockCandidates = [
      {
        position: "Committee",
        allowMultiple: true,
        candidates: [
          { id: 1, name: "Alice", level: "Sophomore", imageUrl: "test.jpg" },
          { id: 2, name: "Bob", level: "Freshman", imageUrl: "test2.jpg" },
        ],
      },
    ];
    jest.mock("../../data/candidates.json", () => mockCandidates);

    localStorage.setItem(
      "mathsVoterData",
      JSON.stringify({ matricNumber: "123" })
    );

    render(<VotingPage />);

    const checkbox1 = screen.getByLabelText("Alice");
    const checkbox2 = screen.getByLabelText("Bob");

    fireEvent.click(checkbox1);
    expect(checkbox1).toBeChecked();

    fireEvent.click(checkbox2);
    expect(checkbox2).toBeChecked();

    fireEvent.click(checkbox1);
    expect(checkbox1).not.toBeChecked();
    expect(checkbox2).toBeChecked();
  });

  test("submits votes correctly", async () => {
    const mockCandidates = [
      {
        position: "President",
        allowMultiple: false,
        candidates: [
          { id: 1, name: "John Doe", level: "Senior", imageUrl: "test.jpg" },
        ],
      },
    ];
    jest.mock("../../data/candidates.json", () => mockCandidates);

    localStorage.setItem(
      "mathsVoterData",
      JSON.stringify({ matricNumber: "123" })
    );

    render(<VotingPage />);

    const radio = screen.getByLabelText("John Doe");
    fireEvent.click(radio);

    const voteButton = screen.getByText("Cast Vote");
    await act(async () => {
      fireEvent.click(voteButton);
    });

    expect(fetch).toHaveBeenCalledWith("/api/votes", expect.anything());
    expect(mockAddNotification).toHaveBeenCalledWith(
      "success",
      "Thank you for voting!"
    );
  });
});
