import { Outlet } from "react-router-dom";
import { AppShell, Burger, Group, NavLink, Text } from "@mantine/core";
import { useLocation } from "react-router-dom";
import { useUserStore } from "../hooks/useUserStore";
import { useDisclosure } from "@mantine/hooks";
import {
  IconHome,
  IconDeviceDesktopQuestion,
  IconListCheck,
  IconUser,
  IconLogout,
  IconTrophy,
  IconClipboardData,
} from "@tabler/icons-react";

export default function HeaderNav() {
  const location = useLocation();
  const role = useUserStore((store) => store.role);
  const [opened, { toggle }] = useDisclosure(false);

  interface QNavLinkProps {
    link: string;
    label: string;
    logout?: boolean;
    icon: JSX.Element;
  }

  const QNavLink = (props: QNavLinkProps) => {
    return (
      <NavLink
        className={
          "text-center rounded-full m-1 transition-colors " +
          (props.link == location.pathname
            ? "bg-[color:var(--mantine-color-blue-filled)] hover:bg-[color:var(--mantine-color-blue-filled)]"
            : "")
        }
        label={
          <Group className="justify-center gap-2">
            {props.icon} <span className="mt-1">{props.label}</span>
          </Group>
        }
        href={props.link}
      />
    );
  };

  return (
    <AppShell
      navbar={{ width: 250, breakpoint: "sm", collapsed: { mobile: !opened } }}
    >
      <AppShell.Header>
        <Burger
          size="lg"
          opened={opened}
          onClick={toggle}
          className="block sm:hidden mt-1 ml-1"
        />
      </AppShell.Header>

      <AppShell.Navbar withBorder className="pr-3 pl-2">
        <div>
          <Burger
            size="lg"
            opened={opened}
            onClick={toggle}
            className="block sm:hidden mt-1 ml-1 "
          />
        </div>
        <a href="/home" className="mx-auto mt-10">
          <img className="w-20" src="/q.svg"></img>
        </a>
        <Text className="mb-5 text-center text-xl cursor-default  ">
          qstack
        </Text>

        <QNavLink icon={<IconHome />} link="/home" label="Home" />
        {role !== "mentor" && (
          <QNavLink
            icon={<IconDeviceDesktopQuestion />}
            link="/ticket"
            label="Ticket"
          />
        )}
        {role !== "hacker" && (
          <QNavLink icon={<IconListCheck />} link="/queue" label="Queue" />
        )}
        {role !== "hacker" && (
          <QNavLink
            icon={<IconTrophy />}
            link="/leaderboard"
            label="Leaderboard"
          />
        )}
        {role === "admin" && (
          <QNavLink
            icon={<IconClipboardData />}
            link="/stats"
            label="Admin Stats"
          />
        )}
        <QNavLink icon={<IconUser />} link="/profile" label="Profile" />
        <QNavLink
          icon={<IconLogout />}
          link="/api/auth/logout"
          label="Logout"
          logout={true}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
