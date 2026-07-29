import { useState } from 'react'
import type { PremiumCharacterGroup } from '../../lib/premiumGroupsApi'

interface PremiumGroupManagerProps {
  groups: PremiumCharacterGroup[]
  onCreate: (name: string) => Promise<void>
  onRename: (groupId: string, name: string) => Promise<void>
  onDelete: (groupId: string) => Promise<void>
}

export default function PremiumGroupManager({
  groups,
  onCreate,
  onRename,
  onDelete,
}: PremiumGroupManagerProps) {
  const [newGroupName, setNewGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = newGroupName.trim()
    if (!trimmed) return

    setCreating(true)
    setError(null)
    try {
      await onCreate(trimmed)
      setNewGroupName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '그룹 추가에 실패했습니다.')
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (group: PremiumCharacterGroup) => {
    setEditingId(group.id)
    setEditingName(group.name)
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const saveEdit = async (groupId: string) => {
    const trimmed = editingName.trim()
    if (!trimmed) return

    setBusyId(groupId)
    setError(null)
    try {
      await onRename(groupId, trimmed)
      cancelEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : '이름 변경에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (group: PremiumCharacterGroup) => {
    if (!confirm(`"${group.name}" 그룹을 삭제할까요?\n속한 캐릭터는 미분류로 이동해요.`)) return

    setBusyId(group.id)
    setError(null)
    try {
      await onDelete(group.id)
      if (editingId === group.id) cancelEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : '그룹 삭제에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="panel-light p-4 space-y-4">
      <div>
        <h2 className="font-semibold text-slate-100">그룹 관리</h2>
        <p className="text-xs text-slate-500 mt-1">아이디별로 캐릭터를 묶어서 볼 수 있어요</p>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newGroupName}
          onChange={(e) => {
            setNewGroupName(e.target.value)
            if (error) setError(null)
          }}
          placeholder="예: 메인 ID, 부캐 ID"
          className="input-field text-sm flex-1"
        />
        <button
          type="submit"
          disabled={creating || !newGroupName.trim()}
          className="btn-primary text-sm px-4 py-2 disabled:opacity-50 shrink-0"
        >
          {creating ? '...' : '그룹 추가'}
        </button>
      </form>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {groups.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-3">아직 그룹이 없어요</p>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-center gap-2 p-3 rounded-lg bg-dark-surface/50 border border-dark-border"
            >
              {editingId === group.id ? (
                <>
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="input-field text-sm flex-1"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(group.id)}
                    disabled={busyId === group.id || !editingName.trim()}
                    className="text-xs text-violet-300 hover:text-violet-200 disabled:opacity-50"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-slate-200 truncate">{group.name}</span>
                  <button
                    type="button"
                    onClick={() => startEdit(group)}
                    disabled={busyId === group.id}
                    className="text-xs text-slate-500 hover:text-slate-300 disabled:opacity-50"
                  >
                    이름 변경
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(group)}
                    disabled={busyId === group.id}
                    className="text-xs text-slate-500 hover:text-red-400 disabled:opacity-50"
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
