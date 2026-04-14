import { render, screen } from "@testing-library/react";
import Layout from "./Layout";

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
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: "/" }),
  }),
  { virtual: true },
);

describe("Layout component", () => {
  it("renders navbar and child content", () => {
    render(<Layout><h1>Dashboard Content</h1></Layout>);

    expect(screen.getByText("Learning")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
    expect(screen.getByTestId("user-button")).toBeInTheDocument();
  });
});
