import random

def initiative(dexterity, wits):
    return random(1, 11) + dexterity + wits
