import typing
from PyQt5.QtWidgets import QLabel, QLineEdit, QStackedWidget, QWidget


class QTextEntryDisplay(QStackedWidget):
    """Widget to flip between a text-entry box and a display"""
    def __init__(self, parent: typing.Optional[QWidget] = None) -> None:
        super().__init__(parent=parent)
        self.entry = QLineEdit()
        self.display = QLabel()
        self.addWidget(self.display)
        self.addWidget(self.entry)

    def text(self):
        return self.entry.text()

    def setText(self, txt):
        self.display.setText(txt)
