import { fireEvent, render, screen } from "@testing-library/react";
import Navbar from "./Navbar";

const mockNavigate = jest.fn();
let mockPathname = "/";

jest.mock("@clerk/clerk-react", () => ({
  UserButton: () => <div data-testid="user-button">User</div>,
}));

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ children, to, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockPathname }),
  }),
  { virtual: true },
);

describe("Navbar component", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("does not show back button on home route", () => {
    mockPathname = "/";
    render(<Navbar />);

    expect(screen.queryByText("← Back")).not.toBeInTheDocument();
  });

  it("calls onBackClick on quiz page when provided", () => {
    mockPathname = "/quiz";
    const onBackClick = jest.fn();
    render(<Navbar onBackClick={onBackClick} />);

    fireEvent.click(screen.getByText("← Back"));
    expect(onBackClick).toHaveBeenCalledTimes(1);
  });

  it("shows exit modal on quiz page when no back handler is provided", () => {
    mockPathname = "/quiz";
    render(<Navbar />);

    fireEvent.click(screen.getByText("← Back"));
    expect(screen.getByText("Exit Quiz?")).toBeInTheDocument();
  });

  it("navigates back for non-quiz routes", () => {
    mockPathname = "/learning";
    render(<Navbar />);

    fireEvent.click(screen.getByText("← Back"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
