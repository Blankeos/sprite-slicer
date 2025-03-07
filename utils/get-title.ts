const TITLE_TEMPLATE = "%s | Sprite Slicer";

export default function getTitle(title: string = "Home") {
  return TITLE_TEMPLATE.replace("%s", title);
}
