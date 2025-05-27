import { useEffect, useState, useCallback } from "react";
import {
  Container,
  Paper,
  Text,
  LoadingOverlay,
  Title,
  Table,
  Group,
  Rating,
  Button
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { computeNormalizedRating } from "../utils";
import * as admin from "../api/admin";

interface ticket {
  total: number;
  averageRating: number;
  averageTime: number;
}

interface user {
  name: string;
  email: string;
  role: string;
  location: string;
  discord: string;
  reviews: Array<string>;
  id: number;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [ticketStats, setTicketStats] = useState<ticket>();
  const [users, setUsers] = useState<Array<user>>([]);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null); // Track which user's row is expanded

  const toggleExpandRow = (userId: number) => {
    setExpandedUserId(expandedUserId === userId ? null : userId); // Toggle between expanding and collapsing
  };

  const fetchStats = useCallback(async () => {
    try {
      const ticketRes = await admin.getTicketStats();
      const userRes = await admin.getUserStats();

      if (!ticketRes.ok) {
        throw new Error("Ticket stats fetch failed");
      }

      if (ticketRes.ok) {
        const ticketStats: ticket = {
          total: parseInt(ticketRes.tags.total),
          averageRating: parseFloat(ticketRes.tags.averageRating),
          averageTime: parseInt(ticketRes.tags.averageTime)
        };
        setTicketStats(ticketStats);
        setLoading(false);
      }

      if (userRes.ok) {
        setUsers(userRes.tags);
        setLoading(false);
      }
    } catch (error) {
      navigate("/error");
    }
  }, [navigate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
        {ticketStats?.total !== undefined && (
          <Group
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem 0",
            }}
          >
            <Paper style={{ padding: "md", backgroundColor: "#20232a" }}>
              <Title order={2} style={{ marginBottom: "0.5rem" }}>
                Ticket Stats
              </Title>
              <Text>Total Resolved Tickets: {ticketStats.total}</Text>
              <Text>Average Time to Claim Ticket: {ticketStats.averageTime}</Text>
              <Text>
                Average Mentor Rating:{" "}
                {computeNormalizedRating(
                  ticketStats.averageRating,
                  ticketStats.total
                )}
              </Text>
              <Rating
                value={parseFloat(
                  computeNormalizedRating(
                    ticketStats.averageRating,
                    ticketStats.total
                  )
                )}
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
                  <Table.Th>Reviews</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((user, _) => (
                  <>
                    <Table.Tr>
                      <Table.Td>{user.name}</Table.Td>
                      <Table.Td>{user.email}</Table.Td>
                      <Table.Td>{user.role}</Table.Td>
                      <Table.Td>{user.location}</Table.Td>
                      <Table.Td>{user.discord}</Table.Td>
                      <Table.Td>
                        {user.reviews && user.reviews.length > 0 && (
                          <Button
                            onClick={() => toggleExpandRow(user.id)}
                            variant="outline"
                          >
                            {expandedUserId === user.id ? "Hide Reviews" : "View Reviews"}
                          </Button>
                        )}
                      </Table.Td>
                    </Table.Tr>
                    {expandedUserId === user.id && (
                      <>
                        {user.reviews.length > 0 ? (
                          user.reviews.map((review, index) => (
                            <Table.Tr key={index}>
                              <Table.Td colSpan={7} style={{ paddingLeft: "2rem" }}>
                                <strong>Review {index + 1}:</strong> {review}
                              </Table.Td>
                            </Table.Tr>
                          ))
                        ) : (
                          <Table.Tr>
                            <Table.Td colSpan={7} style={{ paddingLeft: "2rem" }}>
                              No reviews available
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </>
                    )}
                  </>
                ))}
              </Table.Tbody>
            </Table>
          </Group>
        )}
      </Paper>
    </Container>
  );
}
