from wod_app.utils import Database
from .chronicle import Chronicle


from PyQt5.QtWidgets import (QApplication, QGridLayout, QLabel, QLineEdit,
                             QListWidget, QMainWindow, QPushButton,
                             QStackedWidget, QWidget)


class ChronicleWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()

        self.db = Database('db.sqlite')

        cursor = self.db.load_table("chronicles").fetchall()

        self.list_of_chronicles = []
        for row in cursor:
            c = Chronicle(
                row[1],
                row[2],
                [],
                [],
                row[3],
                row[4],
                [],
                [],
            )
            self.list_of_chronicles.append(c)

        self.setWindowTitle("Chronicle Manager")

        self.layout = QGridLayout()

        self.chronicle_list = QListWidget()
        for chron in self.list_of_chronicles:
            self.chronicle_list.addItem(chron.name)

        self.chronicle_list.itemClicked.connect(self.on_chronicle_select)

        self.new_chronicle_stack = QStackedWidget()
        self.new_chronicle_button = QPushButton("New Chronicle")
        self.save_chronicle_button = QPushButton("Save Chronicle")
        self.new_chronicle_stack.addWidget(self.new_chronicle_button)
        self.new_chronicle_stack.addWidget(self.save_chronicle_button)

        self.name_label = QLabel("Name:")
        self.name_writer = QLineEdit()
        self.name_display = QLabel()

        self.name_stacked = QStackedWidget()
        self.name_stacked.addWidget(self.name_display)
        self.name_stacked.addWidget(self.name_writer)

        self.storyteller_label = QLabel("Storyteller:")
        self.storyteller_writer = QLineEdit()
        self.storyteller_display = QLabel()

        self.storyteller_stacked = QStackedWidget()
        self.storyteller_stacked.addWidget(self.storyteller_display)
        self.storyteller_stacked.addWidget(self.storyteller_writer)
        # self.name_label = QLabel("Locations:")
        # self.name_label = QLabel("Player Characters:")
        # self.name_label = QLabel("Non-Player Characters:")
        self.theme_label = QLabel("Theme:")
        self.theme_writer = QLineEdit()
        self.theme_display = QLabel()

        self.theme_stacked = QStackedWidget()
        self.theme_stacked.addWidget(self.theme_display)
        self.theme_stacked.addWidget(self.theme_writer)

        self.mood_label = QLabel("Mood:")
        self.mood_writer = QLineEdit()
        self.mood_display = QLabel()

        self.mood_stacked = QStackedWidget()
        self.mood_stacked.addWidget(self.mood_display)
        self.mood_stacked.addWidget(self.mood_writer)
        # self.name_label = QLabel("Game Lines:")
        # self.name_label = QLabel("Permitted Books:")

        self.layout.addWidget(self.chronicle_list, 0, 0, 3, 1)
        self.layout.addWidget(self.new_chronicle_stack, 3, 0)

        self.layout.addWidget(self.name_label, 0, 1)
        self.layout.addWidget(self.storyteller_label, 1, 1)
        self.layout.addWidget(self.theme_label, 2, 1)
        self.layout.addWidget(self.mood_label, 3, 1)

        self.layout.addWidget(self.name_stacked, 0, 2)
        self.layout.addWidget(self.storyteller_stacked, 1, 2)
        self.layout.addWidget(self.theme_stacked, 2, 2)
        self.layout.addWidget(self.mood_stacked, 3, 2)

        self.widget = QWidget()
        self.widget.setLayout(self.layout)

        self.new_chronicle_button.clicked.connect(self.new_chronicle_clicked)
        self.save_chronicle_button.clicked.connect(self.save_chronicle_clicked)

        self.setCentralWidget(self.widget)

    def new_chronicle_clicked(self):
        self.name_stacked.setCurrentIndex(1)
        self.storyteller_stacked.setCurrentIndex(1)
        self.theme_stacked.setCurrentIndex(1)
        self.mood_stacked.setCurrentIndex(1)
        self.new_chronicle_stack.setCurrentIndex(1)

    def save_chronicle_clicked(self):
        c = Chronicle(
            self.name_writer.text(), 
            self.storyteller_writer.text(), 
            [], 
            [], 
            self.theme_writer.text(), 
            self.mood_writer.text(), 
            [], 
            []
            )
        self.db.create_record('chronicles', ["chronicle_id", "name", "storyteller", "theme", "mood"], [len(self.list_of_chronicles)+1, c.name, c.storyteller, c.theme, c.mood])
        self.list_of_chronicles.append(c)
        self.chronicle_list.addItem(c.name)
        self.name_stacked.setCurrentIndex(0)
        self.storyteller_stacked.setCurrentIndex(0)
        self.theme_stacked.setCurrentIndex(0)
        self.mood_stacked.setCurrentIndex(0)
        self.new_chronicle_stack.setCurrentIndex(0)
        self.name_display.setText(c.name)
        self.storyteller_display.setText(c.storyteller)
        self.theme_display.setText(c.theme)
        self.mood_display.setText(c.mood)

    def on_chronicle_select(self, item):
        self.name_stacked.setCurrentIndex(0)
        self.storyteller_stacked.setCurrentIndex(0)
        self.theme_stacked.setCurrentIndex(0)
        self.mood_stacked.setCurrentIndex(0)
        self.new_chronicle_stack.setCurrentIndex(0)
        # print(item.text())
        chron = [x for x in self.list_of_chronicles if x.name == item.text()][0]
        self.name_display.setText(chron.name)
        self.storyteller_display.setText(chron.storyteller)
        self.theme_display.setText(chron.theme)
        self.mood_display.setText(chron.mood)


if __name__ == "__main__":
    app = QApplication([])

    window = ChronicleWindow()
    window.show()

    app.exec_()
