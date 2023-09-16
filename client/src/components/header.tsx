import { Outlet } from "react-router-dom";
import { AppShell, Group, Burger, Menu } from "@mantine/core";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../hooks/useUserStore";
import { useDisclosure } from "@mantine/hooks";

export default function HeaderNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = useUserStore((store) => store.role);
  const [opened, { toggle }] = useDisclosure(false);

  interface navLinkProps {
    link: string;
    label: string;
    logout?: boolean;
  }

  function NavLink(props: navLinkProps) {
    return (
      <a
        className={
          "text-white py-1 px-3 my-2 text-lg rounded-md transition-colors" +
          (props.link == location.pathname
            ? " sm:bg-[color:var(--mantine-color-blue-filled)] sm:hover:bg-[color:var(--mantine-color-blue-filled-hover)]"
            : " sm:hover:bg-neutral-800")
        }
        onClick={(e) => {
          e.preventDefault;
          if (props.logout) {
            window.location.href = props.link;
          } else {
            navigate(props.link);
          }
        }}
      >
        {props.label}
      </a>
    );
  }

  function BurgerNavLink(props: navLinkProps) {
    return (
      <Menu.Item
        className={
          props.link == location.pathname
            ? "bg-[color:var(--mantine-color-blue-filled)] hover:bg-[color:var(--mantine-color-blue-filled-hover)]"
            : "hover:bg-neutral-800"
        }
      >
        <a className="text-4xl"
          onClick={(e) => {
            e.preventDefault;
            toggle();
            if (props.logout) {
              window.location.href = props.link;
            } else {
              navigate(props.link);
            }
          }}
        >
          {props.label}
        </a>
      </Menu.Item>
    );
  }

  return (
    <AppShell header={{ height: 50 }}>
      {location.pathname == "/" ? (
        <></>
      ) : (
        <AppShell.Header className="">
          <Menu opened={opened}>
            <Menu.Target>
              <Burger
                size="lg"
                opened={opened}
                onClick={toggle}
                className="block sm:hidden mt-1 ml-1"
              />
            </Menu.Target>
            <Menu.Dropdown className="sm:hidden">
            <BurgerNavLink link="/home" label="Home" />

              <BurgerNavLink link="/ticket" label="Ticket" />

              {role == "mentor" && (
                <BurgerNavLink link="/queue" label="Queue" />
              )}

              <BurgerNavLink link="/profile" label="Profile" />

              <BurgerNavLink
                link="/api/auth/logout"
                label="Logout"
                logout={true}
              />
            </Menu.Dropdown>
          </Menu>

          <Group px={10} justify="space-between" className="hidden sm:flex">
            <NavLink link="/home" label="qstack" />
            <Group gap={10}>
              <NavLink link="/ticket" label="Ticket" />
              {role == "mentor" && <NavLink link="/queue" label="Queue" />}
              <NavLink link="/profile" label="Profile" />
              <NavLink link="/api/auth/logout" label="Logout" logout={true} />
            </Group>
          </Group>
        </AppShell.Header>
      )}

      <Outlet />
    </AppShell>
  );
}
