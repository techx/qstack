import { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Text,
  LoadingOverlay,
  Title,
  Table,
  Group,
  Rating,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import * as admin from "../api/admin";

interface ticket {
  total: number;
  averageRating: number;
}

interface user {
  name: string;
  email: string;
  role: string;
  location: string;
  discord: string;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [ticketStats, setTicketStats] = useState<ticket>();
  const [users, setUsers] = useState<Array<user>>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const ticketRes = await admin.getTicketStats();
      const userRes = await admin.getUserStats();

      if (!ticketRes.ok) {
        throw new Error('Ticket stats fetch failed');
      }

      if (ticketRes.ok) {
        setTicketStats(ticketRes.tags);
        setLoading(false);
      }

      if (userRes.ok) {
        setUsers(userRes.tags);
        setLoading(false);
      }
    } catch (error) {
      navigate('/error');
    }
  };

  return (
    <Container size="md" py="6rem">
      <LoadingOverlay visible={loading} />
      <Title order={1} style={{ textAlign: "center", marginBottom: "2rem" }}>
        Admin Stats Panel
      </Title>

      <Paper
        style={{ padding: "2rem", backgroundColor: "#20232a", color: "white" }}
        shadow="xs"
      >
        {ticketStats?.total && (
          <Group
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #333",
              padding: "1rem 0",
            }}
          >
            <Paper style={{ padding: "md" }} shadow="xs">
              <Title order={2} style={{ marginBottom: "0.5rem" }}>
                Ticket Stats
              </Title>
              <Text>Total Resolved Tickets: {ticketStats.total}</Text>
              <Text>
                Average Mentor Rating: {ticketStats.averageRating.toFixed(2)}/5
              </Text>
              <Rating
                value={ticketStats.averageRating}
                size="lg"
                fractions={10}
                readOnly
              />
            </Paper>
          </Group>
        )}
        {users?.length > 0 && (
          <Group
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #333",
              padding: "1rem 0",
            }}
          >
            <Title order={2} style={{ marginBottom: "0.5rem" }}>
              User Information
            </Title>
            <Table
              striped
              borderColor="grey"
              withColumnBorders
              highlightOnHover
              style={{ marginTop: "1rem" }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Location</Table.Th>
                  <Table.Th>Discord</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((user, index) => (
                  <tr key={index}>
                    <Table.Td>{user.name}</Table.Td>
                    <Table.Td>{user.email}</Table.Td>
                    <Table.Td>{user.role}</Table.Td>
                    <Table.Td>{user.location}</Table.Td>
                    <Table.Td>{user.discord}</Table.Td>
                  </tr>
                ))}
              </Table.Tbody>
            </Table>
          </Group>
        )}
      </Paper>
    </Container>
  );
}
