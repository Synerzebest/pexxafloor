'use client';

import { Fragment, ReactNode } from "react";
import type { AppRow } from "@/types/AppRowType";

export default function SearchResults({
  results,
  renderRow,
}: {
  results: AppRow[];
  renderRow: (r: AppRow, i: number) => ReactNode; 
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">Résultats de recherche</h2>
      <div className="overflow-x-auto rounded-xl border border-orange-100 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-orange-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Société</th>
              <th className="px-3 py-2 text-left">Contact</th>
              <th className="px-3 py-2 text-left">Statut</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                  Aucun résultat
                </td>
              </tr>
            ) : (
              results.map((r, i) => <Fragment key={r.id}>{renderRow(r, i)}</Fragment>)
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
