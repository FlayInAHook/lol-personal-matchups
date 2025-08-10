import {
  Badge,
  Box,
  Container,
  Heading,
  HStack,
  Icon,
  Image,
  Input,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useAtom } from "jotai";
import { LuSearch } from "react-icons/lu";
import { championsAtom, latestVersionAtom, searchAtom, type Champion } from "../state/league";

function ChampionCard({ champ, version }: { champ: Champion; version: string }) {
  const img = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image.full}`;
  return (
    <Box borderWidth="1px" rounded="lg" overflow="hidden" bg="bg" shadow="sm" _hover={{ shadow: "md" }}>
      <Image src={img} alt={champ.name} width="100%" height="160px" objectFit="cover" />
      <Stack p={3} gap={1}>
        <HStack justify="space-between">
          <Heading size="sm">{champ.name}</Heading>
          <HStack gap={1}>
            {champ.tags.map((t) => (
              <Badge key={t} colorPalette="gray">{t}</Badge>
            ))}
          </HStack>
        </HStack>
  <Text color="fg.muted" fontSize="sm" css={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{champ.title}</Text>
      </Stack>
    </Box>
  );
}

export default function Champions() {
  const [query, setQuery] = useAtom(searchAtom);
  const [version] = useAtom(latestVersionAtom);
  const [champs] = useAtom(championsAtom);

  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? champs.filter((c) =>
        `${c.name} ${c.title} ${c.tags.join(" ")}`.toLowerCase().includes(normalized)
      )
    : champs;

  return (
    <Container maxW="7xl" py={8}>
      <VStack align="stretch" gap={6}>
        <Stack direction={{ base: "column", md: "row" }} justify="space-between" gap={4}>
          <Heading size="lg">League Champions</Heading>
          <HStack flex={1} maxW={{ base: "full", md: "sm" }}>
            <Icon as={LuSearch} color="fg.muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search champions..."
            />
          </HStack>
        </Stack>

        <Text color="fg.muted" fontSize="sm">Version: {version}</Text>

        <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 6 }} gap={4}>
          {filtered.map((c) => (
            <ChampionCard key={c.id} champ={c} version={version} />
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
}
