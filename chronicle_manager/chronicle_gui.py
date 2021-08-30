from PyQt5.QtWidgets import (
    QApplication, 
    QLabel, 
    QMainWindow, 
    QPushButton, 
    QGridLayout,
    QStackedWidget, 
    QWidget, 
    QListWidget, 
    QLineEdit,
)


class ChronicleWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()

        self.setWindowTitle("Chronicle Manager")

        self.layout = QGridLayout()

        self.chronicle_list = QListWidget()
        self.new_chronicle_button = QPushButton("New Chronicle")

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
        self.layout.addWidget(self.new_chronicle_button, 3, 0)

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

        self.setCentralWidget(self.widget)

    def new_chronicle_clicked(self):
        self.name_stacked.setCurrentIndex(1)
        self.storyteller_stacked.setCurrentIndex(1)
        self.theme_stacked.setCurrentIndex(1)
        self.mood_stacked.setCurrentIndex(1)


app = QApplication([])

window = ChronicleWindow()
window.show()

app.exec_()
