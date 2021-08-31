class Chronicle:
    def __init__(
        self,
        name,
        storyteller,
        locations,
        characters,
        theme,
        mood,
        game_lines,
        permitted_books,
        ) -> None:
        self.name = name
        self.storyteller = storyteller
        self.locations = locations
        self.characters = characters
        self.theme = theme
        self.mood = mood
        self.game_lines = game_lines
        self.permitted_books = permitted_books

    def __repr__(self) -> str:
        return f"{self.name}"
