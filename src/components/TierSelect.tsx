import { HStack, Portal, Select, Text, createListCollection, useSelectContext } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { tierAtom } from "../state/league";

type TierItem = { label: string; value: string; icon: string };

function TierValue() {
  const select = useSelectContext();
  const items = (select.selectedItems as TierItem[]) ?? [];
  if (!items.length) return <Select.ValueText placeholder="Select tier" />;
  const it = items[0];
  return (
    <Select.ValueText>
      <HStack gap={2}>
        <Text as="span" aria-hidden>{it.icon}</Text>
        {it.label}
      </HStack>
    </Select.ValueText>
  );
}

export default function TierSelect() {
  const [tier, setTier] = useAtom(tierAtom);

  const tierCollection = createListCollection<TierItem>({
    items: [
      { label: "Diamond+", value: "diamond_plus", icon: "💎" },
      { label: "D2+", value: "d2_plus", icon: "💎" },
      { label: "Diamond", value: "diamond", icon: "💎" },
      { label: "Emerald+", value: "emerald_plus", icon: "💚" },
      { label: "Emerald", value: "emerald", icon: "💚" },
      { label: "Platinum+", value: "platinum_plus", icon: "🔷" },
      { label: "Platinum", value: "platinum", icon: "🔷" },
      { label: "Gold+", value: "gold_plus", icon: "🥇" },
      { label: "Gold", value: "gold", icon: "🥇" },
      { label: "Silver", value: "silver", icon: "🥈" },
      { label: "Bronze", value: "bronze", icon: "🥉" },
      { label: "Iron", value: "iron", icon: "⚙️" },
      { label: "Master+", value: "master_plus", icon: "🟣" },
      { label: "Master", value: "master", icon: "🟣" },
      { label: "Grandmaster+", value: "grandmaster_plus", icon: "🔥" },
      { label: "Grandmaster", value: "grandmaster", icon: "🔥" },
      { label: "Challenger", value: "challenger", icon: "🏆" },
      { label: "One-trick", value: "1trick", icon: "🎭" },
      { label: "All players", value: "all", icon: "🌍" },
      { label: "Unranked", value: "unranked", icon: "❔" },
    ],
  });

  return (
    <HStack width="xs">
      <Select.Root
        size="md"
        width="full"
        collection={tierCollection}
        value={[tier]}
        onValueChange={(e) => setTier((e.value[0] as any) ?? "diamond_plus")}
        positioning={{ sameWidth: true }}
      >
        <Select.HiddenSelect name="tier" />
        <Select.Label>Tier</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <TierValue />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {tierCollection.items.map((item) => (
                <Select.Item item={item} key={item.value} justifyContent="flex-start">
                  <HStack>
                    <Text as="span" aria-hidden>{item.icon}</Text>
                    {item.label}
                  </HStack>
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    </HStack>
  );
}
