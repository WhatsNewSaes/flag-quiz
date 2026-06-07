import { JeopardyCell, continentOrder } from '../hooks/useJeopardy';

interface JeopardyBoardProps {
  board: JeopardyCell[][];
  onSelectCell: (row: number, col: number) => void;
}

export function JeopardyBoard({ board, onSelectCell }: JeopardyBoardProps) {
  return (
    <div className="w-full">
      <div className="w-full">
        {/* Header row with continent names */}
        <div className="grid grid-cols-6 gap-1 mb-1">
          {continentOrder.map(continent => (
            <div
              key={continent}
              className="flex min-h-10 items-center justify-center rounded-t-lg bg-[#2563EB] px-0.5 py-1 text-center text-[0.46rem] font-bold leading-tight text-white sm:px-1 sm:py-2 sm:text-sm"
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
                  aspect-[4/3] flex items-center justify-center font-bold text-[0.62rem] sm:text-2xl
                  rounded transition-all
                  ${cell.used
                    ? 'bg-[#1E3A8A] text-[#1E3A8A] cursor-default'
                    : 'bg-[#2563EB] text-white hover:bg-blue-500 hover:scale-105 cursor-pointer shadow-lg'
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
