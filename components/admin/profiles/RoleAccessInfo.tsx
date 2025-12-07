import { Card, Row, Col } from "antd";
import { motion } from "framer-motion";
import { User, Truck, Boxes, Users, Shield } from "lucide-react";

const MotionCard = motion(Card);

function RoleAccessInfo({ locale }: { locale: string }) {
  const t = {
    fr: {
      title: "Aperçu des rôles",
      client: "Accès à la boutique, commandes, compte personnel.",
      delivery: "Accès aux tournées et infos de livraison.",
      storekeeper: "Picking, vérification, gestion du stock.",
      collaborator: "Accès limité : commandes + lecture catalogues.",
      admin: "Accès total : produits, pages, rôles, commandes.",
    },
    en: {
      title: "Role Overview",
      client: "Access to shop, orders, personal account.",
      delivery: "Access to delivery routes and info.",
      storekeeper: "Picking, verification, stock management.",
      collaborator: "Limited access: orders + catalog reading.",
      admin: "Full access: products, pages, roles, orders.",
    },
    nl: {
      title: "Roloverzicht",
      client: "Toegang tot shop, bestellingen, eigen account.",
      delivery: "Toegang tot leverroutes en info.",
      storekeeper: "Picking, controle, voorraadbeheer.",
      collaborator: "Beperkte toegang: bestellingen + catalogus lezen.",
      admin: "Volledige toegang: producten, pagina’s, rollen, orders.",
    },
  }[locale];

  if (!t) {
      return <p>Role access error</p>
  }

  const roles = [
    {
      name: "Client",
      desc: t.client,
      icon: <User className="w-5 h-5 text-orange-500" />,
    },
    {
      name: "Livreur",
      desc: t.delivery,
      icon: <Truck className="w-5 h-5 text-orange-500" />,
    },
    {
      name: "Magasinier",
      desc: t.storekeeper,
      icon: <Boxes className="w-5 h-5 text-orange-500" />,
    },
    {
      name: "Collaborateur",
      desc: t.collaborator,
      icon: <Users className="w-5 h-5 text-orange-500" />,
    },
    {
      name: "Admin",
      desc: t.admin,
      icon: <Shield className="w-5 h-5 text-orange-500" />,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <Row gutter={[16, 16]}>
        {roles.map((r, i) => (
          <Col xs={24} sm={12} lg={8} key={i}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-neutral-900 text-neutral-200 border-neutral-700 cursor-pointer hover:shadow-sm duration-300"
            >
              <div className="flex items-center gap-3 mb-2">
                {r.icon}
                <p className="font-semibold">{r.name}</p>
              </div>

              <p className="text-neutral-400 text-sm leading-relaxed">
                {r.desc}
              </p>
            </MotionCard>
          </Col>
        ))}
      </Row>
    </motion.div>
  );
}

export default RoleAccessInfo;
