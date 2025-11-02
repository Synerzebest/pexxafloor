export function getPackImage(slug: string): string {
    switch (slug) {
      case "treillis":
        return "/images/treillis-system.jpg";
      case "agrafe":
        return "/images/tacker-system.jpg";
      case "natte":
        return "/images/plots-system.jpg";
      default:
        return "/images/box.png"; // fallback
    }
  }
  