import random


def wod20_diceroller(dicepool, difficulty=6, specialty=False):
    """
    This determines the number of successes on a roll according to the M20
    rules.

    Args:
        dicepool: int, the number of dice to roll
        difficulty: int, the target number to beat
        specialty: bool, whether or not 10's count double

    Returns:
        num_successes: the number of successes (or the magnitude of the botch)
    """
    roll = [random.randint(1, 11) for _ in range(dicepool)]
    num_successes = len([x for x in roll if x >= difficulty])
    num_botches = len([x for x in roll if x == 1])
    num_tens = len([x for x in roll if x == 10])
    if num_successes == 0:
        return -num_botches
    if specialty:
        num_successes += num_tens
    num_successes -= num_botches
    return max([0, num_successes])
