import { JeopardyCell, continentOrder } from '../hooks/useJeopardy';

interface JeopardyBoardProps {
  board: JeopardyCell[][];
  onSelectCell: (row: number, col: number) => void;
}

export function JeopardyBoard({ board, onSelectCell }: JeopardyBoardProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header row with continent names */}
        <div className="grid grid-cols-6 gap-1 mb-1">
          {continentOrder.map(continent => (
            <div
              key={continent}
              className="bg-[#2563EB] text-white text-center py-2 px-1 font-bold text-xs sm:text-sm rounded-t-lg"
            >
              {continent}
            </div>
          ))}
        </div>

        {/* Board cells */}
        {board.map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-6 gap-1 mb-1">
            {row.map((cell, colIdx) => (
              <button
                key={`${rowIdx}-${colIdx}`}
                onClick={() => onSelectCell(rowIdx, colIdx)}
                disabled={cell.used}
                className={`
                  aspect-[4/3] flex items-center justify-center font-bold text-lg sm:text-2xl
                  rounded transition-all
                  ${cell.used
                    ? 'bg-[#1E3A8A] text-[#1E3A8A] cursor-default'
                    : 'bg-[#2563EB] text-yellow-400 hover:bg-blue-500 hover:scale-105 cursor-pointer shadow-lg'
                  }
                `}
              >
                {cell.used ? '' : `$${cell.value}`}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
