import { Outlet } from 'react-router-dom';
import { createStyles, AppShell, Header, Group, Text, rem } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const useStyles = createStyles((theme) => ({
  link: {
    display: 'block',
    lineHeight: 1,
    padding: `${rem(8)} ${rem(12)}`,
    borderRadius: theme.radius.sm,
    fontSize: theme.fontSizes.xl,
    textDecoration: 'none',
    color: theme.colors.dark[0],

    '&:hover': {
      backgroundColor: theme.colors.dark[6],
    },
  },
  linkActive: {
    '&, &:hover': {
      backgroundColor: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).background,
      color: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).color,
    },
  },
}));

export default function HeaderNav() {
  const { classes, cx } = useStyles();
  const [active, setActive] = useState('Profile');
  const navigate = useNavigate();
  const location = useLocation();

  interface navLinkProps {
    link: string;
    label: string;
  }

  const navLink = (props: navLinkProps, logout: boolean = false) => {
    return (
      <a
        className={cx(classes.link, { [classes.linkActive]: active === props.label })}
        onClick={(e) => {
          e.preventDefault;
          setActive(props.label);
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
    <AppShell
      header={
        location.pathname == '/' ? undefined : (
          <Header height={50} px={'md'}>
            <Group position="apart" py={7}>
              {navLink({ link: '/home', label: 'qstack' })}
              <Group spacing={5}>
                {navLink({ link: '/create', label: 'Create' })}
                {navLink({ link: '/tickets', label: 'Tickets' })}
                {navLink({ link: '/profile', label: 'Profile' })}
                {navLink({ link: '/api/auth/logout', label: 'Logout' }, true)}
              </Group>
            </Group>
          </Header>
        )
      }
    >
      <Outlet />
    </AppShell>
  );
}
