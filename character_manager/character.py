class Character:
    def __init__(
        self,
    ) -> None:
        self.name = ""
        self.player = ""
        self.chronicle = ""
        self.nature = ""
        self.demeanor = ""

        # Attributes
        self.strength = 1
        self.dexterity = 1
        self.stamina = 1

        self.charisma = 1
        self.manipulation = 1
        self.appearance = 1

        self.perception = 1
        self.intelligence = 1
        self.wits = 1

        self.health_tracker = [0, 0, -1, -1, -2, -2, -5, -1000]
        self.bashing_levels = 0
        self.lethal_levels = 0
        self.aggravated_levels = 0

    def health(self) -> int:
        return self.bashing_levels + self.lethal_levels + self.aggravated_levels

    def health_penalty(self) -> int:
        return self.health_tracker[self.health]
