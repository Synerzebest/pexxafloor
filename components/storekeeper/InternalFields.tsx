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
    <Card title="Informations internes">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Note interne</h3>
          <Input
            placeholder="ex. préparation rapide, emballage à revoir..."
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
          />
        </div>

        <div>
          <h3 className="font-semibold mb-1">Commentaire interne</h3>
          <TextArea
            rows={3}
            placeholder="Détails supplémentaires"
            value={internalComment}
            onChange={(e) => setInternalComment(e.target.value)}
          />
        </div>

        <div className="pt-2">
          <Button type="primary" onClick={onSave}>
            Enregistrer
          </Button>
        </div>
      </div>
    </Card>
  );
}
