import random

def initiative(dexterity, wits):
    return random.randint(1, 11) + dexterity + wits
