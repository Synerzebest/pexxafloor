import { Card, Input, Button } from "antd";

const { TextArea } = Input;

export default function InternalFields({
  internalNote,
  internalComment,
  setInternalNote,
  setInternalComment,
  onSave,
}: {
  internalNote: string;
  internalComment: string;
  setInternalNote: (v: string) => void;
  setInternalComment: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <Card title="Notes internes" className="rounded-2xl border-slate-200 shadow-sm">
      <div className="space-y-4">
        <div>
          <h3 className="mb-1 text-sm font-semibold text-slate-700">Note courte</h3>
          <Input
            placeholder="Ex. préparation urgente…"
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
          />
        </div>

        <div>
          <h3 className="mb-1 text-sm font-semibold text-slate-700">Commentaire détaillé</h3>
          <TextArea
            rows={3}
            placeholder="Détails supplémentaires"
            value={internalComment}
            onChange={(e) => setInternalComment(e.target.value)}
          />
        </div>

        <div className="pt-2">
          <Button type="primary" block onClick={onSave}>
            Enregistrer les notes
          </Button>
        </div>
      </div>
    </Card>
  );
}
