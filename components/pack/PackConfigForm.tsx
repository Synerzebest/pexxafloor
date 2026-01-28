"use client";

import { InputNumber } from "antd";

type Props = {
  slug: string;
  surface: number;
  pasDePose: number;
  tuyauType: "PERT" | "PERT-AL-PERT";
  typeAgrafe: 40 | 60;
  onSurfaceChange: (v: number) => void;
  onPasDePoseChange: (v: number) => void;
  onTuyauTypeChange: (v: "PERT" | "PERT-AL-PERT") => void;
  onTypeAgrafeChange: (v: 40 | 60) => void;
};

export function PackConfigForm({
  slug,
  surface,
  pasDePose,
  tuyauType,
  typeAgrafe,
  onSurfaceChange,
  onPasDePoseChange,
  onTuyauTypeChange,
  onTypeAgrafeChange,
}: Props) {
  const tuyauOptions = ["PERT", "PERT-AL-PERT"] as const;

  const tubLength = (surface / pasDePose) * 100;
  const circuitsNumber = Math.ceil(tubLength / 100);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">
        Paramètres du pack
      </h2>

      {/* Pas de pose + Type de tuyau */}
      <div className="md:flex md:gap-6 space-y-6 md:space-y-0">
        {/* Pas de pose */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pas de pose (distance entre les tuyaux)
          </label>

          <div className="flex gap-2">
            {[20, 15, 10].map((val) => {
              const tooltips: Record<number, string> = {
                20: "Pour des constructions bien isolées ou pour chauffage d'appoint",
                15: "Pour des constructions moyennement isolées",
                10: "Pour des constructions anciennes ou faiblement isolées",
              };

              return (
                <div key={val} className="relative group">
                  <button
                    onClick={() => onPasDePoseChange(val)}
                    className={`px-4 py-1.5 rounded-lg text-sm border transition
                      ${
                        pasDePose === val
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-white border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-500"
                      }`}
                  >
                    {val} cm
                  </button>

                  <span className="absolute left-1/2 -translate-x-1/2 -top-10 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap bg-gray-900 text-white text-xs py-1 px-2 rounded shadow-lg transition">
                    {tooltips[val]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Type de tuyau */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de tuyau
          </label>

          <div className="flex gap-2">
            {tuyauOptions.map((val) => {
              const tooltips: Record<string, string> = {
                PERT:
                  "Tuyau souple, barrière anti-oxygène, le plus utilisé pour le chauffage au sol",
                "PERT-AL-PERT":
                  "Couche d'aluminium entre deux couches de PERT, très malléable",
              };

              return (
                <div key={val} className="relative group">
                  <button
                    onClick={() => onTuyauTypeChange(val)}
                    className={`px-4 py-1.5 rounded-lg text-sm border transition
                      ${
                        tuyauType === val
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-white border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-500"
                      }`}
                  >
                    {val}
                  </button>

                  <span className="absolute left-1/2 -translate-x-1/2 -top-10 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap bg-gray-900 text-white text-xs py-1 px-2 rounded shadow-lg transition">
                    {tooltips[val]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agrafes (uniquement pour le pack agrafe) */}
      {slug === "agrafe" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hauteur des agrafes
          </label>

          <div className="flex gap-2">
            {[40, 60].map((val) => {
              const tooltips: Record<number, string> = {
                40: "Pour isolant 40–60 mm",
                60: "Pour isolant > 60 mm",
              };

              return (
                <div key={val} className="relative group">
                  <button
                    onClick={() => onTypeAgrafeChange(val as 40 | 60)}
                    className={`px-4 py-1.5 rounded-lg text-sm border transition
                      ${
                        typeAgrafe === val
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-white border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-500"
                      }`}
                  >
                    {val} mm
                  </button>

                  <span className="absolute left-1/2 -translate-x-1/2 -top-10 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap bg-gray-900 text-white text-xs py-1 px-2 rounded shadow-lg transition">
                    {tooltips[val]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Surface */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Surface à chauffer
        </label>

        <div className="flex items-center gap-2">
          <InputNumber
            min={1}
            value={surface}
            onChange={(v) => onSurfaceChange(Number(v))}
            size="large"
            className="w-24"
          />
          <span className="text-gray-500">m²</span>
        </div>

        <p className="text-gray-500 text-sm mt-1">
          Tuyau estimé : {Math.ceil(tubLength)} m - Nombre de circuits estimé : {circuitsNumber}
        </p>
      </div>
    </div>
  );
}
