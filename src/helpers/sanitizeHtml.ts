const allowedTags = new Set([
  "B",
  "BR",
  "DIV",
  "EM",
  "I",
  "LI",
  "OL",
  "P",
  "SPAN",
  "STRONG",
  "UL",
]);

const blockedTags = new Set(["IFRAME", "OBJECT", "SCRIPT", "STYLE"]);

const unwrapElement = (element: Element) => {
  const parent = element.parentNode;
  if (!parent) return;

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  parent.removeChild(element);
};

export const sanitizeHtml = (html: string): string => {
  const template = document.createElement("template");
  template.innerHTML = html;

  [...template.content.querySelectorAll("*")].forEach((element) => {
    if (blockedTags.has(element.tagName)) {
      element.remove();
      return;
    }

    if (!allowedTags.has(element.tagName)) {
      unwrapElement(element);
      return;
    }

    [...element.attributes].forEach((attribute) => {
      element.removeAttribute(attribute.name);
    });
  });

  return template.innerHTML;
};

export const getTextFromHtml = (html: string): string => {
  const template = document.createElement("template");
  template.innerHTML = html;

  return template.content.textContent?.trim() ?? "";
};
