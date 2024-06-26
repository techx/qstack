import { useEffect, useState, useCallback } from "react";
import {
  Container,
  Paper,
  Group,
  Text,
  LoadingOverlay,
  Badge,
  Title,
  Rating,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { computeNormalizedRating } from "../utils";
import * as queue from "../api/queue";

interface mentor {
  name: string;
  rank: number;
  num_resolved_tickets: number;
  num_ratings: number;
  average_rating: number;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [rankings, setRankings] = useState<Array<mentor>>([]);

  const getRankings = useCallback(async () => {
    const res = await queue.getMentorRankings();
    if (res.ok) {
      const rankings = res.rankings;
      rankings.sort((a: mentor, b: mentor) => {
        return (
          parseFloat(computeNormalizedRating(b.average_rating, b.num_ratings)) -
          parseFloat(computeNormalizedRating(a.average_rating, a.num_ratings))
        );
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newRankings = rankings.map((mentor: mentor, idx: any) => ({
        ...mentor,
        rank: idx + 1,
      }));
      setRankings(newRankings);
      setLoading(false);
    } else {
      navigate("/error");
    }
  }, [setRankings, navigate]);

  useEffect(() => {
    getRankings();
    const interval = setInterval(getRankings, 5000);
    return () => clearInterval(interval);
  }, [getRankings]);

  return (
    <Container size="md" py="6rem">
      <LoadingOverlay visible={loading} />
      <Title order={1} style={{ textAlign: "center", marginBottom: "2rem" }}>
        Leaderboard
      </Title>

      <Paper
        style={{ padding: "2rem", backgroundColor: "#20232a", color: "white" }}
        shadow="xs"
      >
        {rankings.map((mentor) => (
          <Group
            key={mentor.name}
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #333",
              padding: "1rem 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {/* <div style={{ marginRight: "1rem" }}>
                {renderIcon(mentor.rank)}
              </div> */}
              <Text
                style={{
                  fontWeight: 500,
                  marginRight: "1rem",
                  fontSize: "1.25rem",
                }}
              >
                {mentor.rank}
              </Text>
              <Text
                style={{ flexGrow: 1, fontWeight: 500, fontSize: "1.25rem" }}
              >
                {mentor.name}
              </Text>
            </div>
            <Rating
              value={parseFloat(
                computeNormalizedRating(
                  mentor.average_rating,
                  mentor.num_ratings
                )
              )}
              size="lg"
              fractions={10}
              readOnly
            />
            <div>
              <Badge
                color="orange"
                variant="light"
                size="xl"
                mr="3"
              >{`Rating: ${computeNormalizedRating(
                mentor.average_rating,
                mentor.num_ratings
              )}`}</Badge>
              <Badge
                color="green"
                variant="light"
                size="xl"
              >{`Tickets: ${mentor.num_resolved_tickets}`}</Badge>
            </div>
          </Group>
        ))}
      </Paper>
    </Container>
  );
}
