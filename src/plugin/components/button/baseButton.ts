class BaseButton {
    constructor(
        public id: string,
        public text: string,
        public className: string
    ) {
        this.id = id;
        this.text = text;
        this.className = className;
    }

    createButton(): HTMLButtonElement {
        const button = document.createElement("button");
        button.id = this.id;
        button.innerText = this.text;
        button.className = this.className;
        return button;
    }
}

export default BaseButton;
