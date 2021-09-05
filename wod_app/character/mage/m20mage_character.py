from character import Character


class M20MageCharacter(Character):
    def __init__(
        self
        ) -> None:
        super().__init__()

        # Abilities
        ## Talents
        self.alertness = 0
        self.art = 0
        self.athletics = 0
        self.awareness = 0
        self.brawl = 0
        self.empathy = 0
        self.expression = 0
        self.intimidation = 0
        self.leadership = 0
        self.streetwise = 0
        self.subterfuge = 0
        ## Skills
        self.crafts = 0
        self.drive = 0
        self.etiquette = 0
        self.firearms = 0
        self.martial_arts = 0
        self.meditation = 0
        self.melee = 0
        self.research = 0
        self.stealth = 0
        self.survival = 0
        self.technology = 0
        ## Knowledges
        self.academics = 0
        self.computer = 0
        self.cosmology = 0
        self.enigmas = 0
        self.esoterica = 0
        self.investigation = 0
        self.law = 0
        self.medicine = 0
        self.occult = 0
        self.politics = 0
        self.science = 0

        self.arete = 1

        # Spheres
        self.correspondence = 0
        self.entropy = 0
        self.forces = 0
        self.life = 0
        self.matter = 0
        self.mind = 0
        self.prime = 0
        self.spirit = 0
        self.time = 0

        self.willpower = 5
        self.temporary_willpower = 5

        self.quintessences = 0
        self.paradox = 0
        self.permanent_paradox = 0
