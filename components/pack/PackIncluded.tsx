"use client";

type Item = {
  id: string;
  description: string;
};

type Props = {
  included: Item[];
};

export function PackIncluded({ included }: Props) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100">
      <h2 className="font-semibold text-xl mb-4 text-gray-800 border-b pb-3">
        Inclus dans le pack
      </h2>

      <ul className="space-y-3">
        {included.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200"
          >
            <div className="flex items-center gap-3">
              {/* Icône check verte */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 text-green-600"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                  clipRule="evenodd"
                />
              </svg>

              <span className="text-gray-800 text-sm font-medium">
                {item.description}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
