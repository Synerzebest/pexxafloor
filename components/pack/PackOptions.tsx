"use client";

type Option = {
  id: string;
  description: string;
  price: number;
};

type Props = {
  options: Option[];
  selectedOptions: Record<string, boolean>;
  setSelectedOptions: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
};

export function PackOptions({
  options,
  selectedOptions,
  setSelectedOptions,
}: Props) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100">
      <h2 className="font-semibold text-xl mb-4 text-gray-800 border-b pb-3">
        Options disponibles (Ajouter)
      </h2>

      <div className="flex flex-col gap-3">
        {options.map((opt) => {
          const checked = selectedOptions[opt.id] || false;

          return (
            <label
              key={opt.id}
              className={`flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer transition duration-300 ${
                checked
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-orange-400 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    setSelectedOptions((prev) => ({
                      ...prev,
                      [opt.id]: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 accent-orange-600 rounded"
                />

                <span className="text-sm font-medium text-gray-800">
                  {opt.description}
                </span>
              </div>

              <span className="font-bold text-gray-700 whitespace-nowrap text-sm">
                + {opt.price.toFixed(2)} €
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
