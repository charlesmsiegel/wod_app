import json
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from PyQt5.QtWidgets import (QApplication, QGridLayout, QLabel, QLineEdit,
                             QListWidget, QMainWindow, QPushButton,
                             QStackedWidget, QWidget, QListWidgetItem)
from .chronicle import Chronicle
from ..utils import load_config, load_tables
from ..gui_components import QTextEntryDisplay


config = load_config()
engine = create_engine(config['DB_NAME'])
Session = sessionmaker(bind=engine)
session = Session()


class ChronicleWindow(QMainWindow):
    """Constructs the Chronicle GUI
    """

    def __init__(self) -> None:
        super().__init__()

        self.list_of_chronicles = session.query(Chronicle).all()

        self.setWindowTitle("Chronicle Manager")

        self.layout = QGridLayout()

        self.chronicle_list = QListWidget()
        for chron in self.list_of_chronicles:
            self.chronicle_list.addItem(chron.name)
        self.chronicle_list.sortItems()

        self.chronicle_list.itemClicked.connect(self.on_chronicle_select)

        self.new_chronicle_stack = QStackedWidget()
        self.new_chronicle_button = QPushButton("New Chronicle")
        self.save_chronicle_button = QPushButton("Save Chronicle")
        self.new_chronicle_stack.addWidget(self.new_chronicle_button)
        self.new_chronicle_stack.addWidget(self.save_chronicle_button)

        self.name_label = QLabel("Name:")
        self.name_data = QTextEntryDisplay()

        self.storyteller_label = QLabel("Storyteller:")
        self.storyteller_data = QTextEntryDisplay()

        # self.name_label = QLabel("Locations:")
        # self.name_label = QLabel("Player Characters:")
        # self.name_label = QLabel("Non-Player Characters:")

        self.theme_label = QLabel("Theme:")
        self.theme_data = QTextEntryDisplay()

        self.mood_label = QLabel("Mood:")
        self.mood_data = QTextEntryDisplay()

        # self.name_label = QLabel("Game Lines:")
        # self.name_label = QLabel("Permitted Books:")

        self.layout.addWidget(self.chronicle_list, 0, 0, 3, 1)
        self.layout.addWidget(self.new_chronicle_stack, 3, 0)

        self.layout.addWidget(self.name_label, 0, 1)
        self.layout.addWidget(self.storyteller_label, 1, 1)
        self.layout.addWidget(self.theme_label, 2, 1)
        self.layout.addWidget(self.mood_label, 3, 1)

        self.layout.addWidget(self.name_data, 0, 2)
        self.layout.addWidget(self.storyteller_data, 1, 2)
        self.layout.addWidget(self.theme_data, 2, 2)
        self.layout.addWidget(self.mood_data, 3, 2)

        self.widget = QWidget()
        self.widget.setLayout(self.layout)

        self.new_chronicle_button.clicked.connect(self.new_chronicle_clicked)
        self.save_chronicle_button.clicked.connect(self.save_chronicle_clicked)

        self.setCentralWidget(self.widget)

    def new_chronicle_clicked(self):
        self.name_data.setCurrentIndex(1)
        self.storyteller_data.setCurrentIndex(1)
        self.theme_data.setCurrentIndex(1)
        self.mood_data.setCurrentIndex(1)
        self.new_chronicle_stack.setCurrentIndex(1)

    def save_chronicle_clicked(self):
        new_chronicle = Chronicle()
        new_chronicle.name = self.name_data.text()
        new_chronicle.storyteller = self.storyteller_data.text()
        new_chronicle.theme = self.theme_data.text()
        new_chronicle.mood = self.mood_data.text()

        session.add(new_chronicle)
        session.commit()
        new_item = QListWidgetItem(new_chronicle.name)

        self.list_of_chronicles = session.query(Chronicle).all()
        self.chronicle_list.addItem(new_item)
        self.chronicle_list.sortItems()

        self.on_chronicle_select(new_item)

    def on_chronicle_select(self, item):
        self.name_data.setCurrentIndex(0)
        self.storyteller_data.setCurrentIndex(0)
        self.theme_data.setCurrentIndex(0)
        self.mood_data.setCurrentIndex(0)
        self.new_chronicle_stack.setCurrentIndex(0)

        chron = session.query(Chronicle).filter_by(name=item.text()).first()

        self.name_data.setText(chron.name)
        self.storyteller_data.setText(chron.storyteller)
        self.theme_data.setText(chron.theme)
        self.mood_data.setText(chron.mood)


if __name__ == "__main__":
    app = QApplication([])

    window = ChronicleWindow()
    window.show()

    app.exec_()
