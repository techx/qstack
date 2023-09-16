import { Outlet } from "react-router-dom";
import { AppShell, Group } from "@mantine/core";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../hooks/useUserStore";

export default function HeaderNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = useUserStore((store) => store.role);

  interface navLinkProps {
    link: string;
    label: string;
  }

  const navLink = (props: navLinkProps, logout: boolean = false) => {
    return (
      <a
        className={
          "text-white py-1 px-3 my-2 text-sm rounded-md transition-colors" +
          (props.link == location.pathname
            ? " bg-[color:var(--mantine-color-blue-filled)] hover:bg-[color:var(--mantine-color-blue-filled-hover)]"
            : " hover:bg-neutral-800")
        }
        onClick={(e) => {
          e.preventDefault;
          if (logout) {
            window.location.href = props.link;
          } else {
            navigate(props.link);
          }
        }}
      >
        {props.label}
      </a>
    );
  };

  return (
    <AppShell header={{ height: 45 }}>
      {location.pathname == "/" ? (
        <></>
      ) : (
        <AppShell.Header className="">
          <Group px={10} justify="space-between" className="">
            {navLink({ link: "/home", label: "qstack" })}
            <Group gap={10}>
              {navLink({ link: "/ticket", label: "Ticket" })}
              {role == "mentor" && navLink({ link: "/queue", label: "Queue" })}
              {navLink({ link: "/profile", label: "Profile" })}
              {navLink({ link: "/api/auth/logout", label: "Logout" }, true)}
            </Group>
          </Group>
        </AppShell.Header>
      )}

      <Outlet />
    </AppShell>
  );
}
