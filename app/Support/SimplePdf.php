<?php

namespace App\Support;

/**
 * Minimal multi-page PDF builder using built-in Helvetica (WinAnsi).
 * Sufficient for tabular financial reports without external PDF packages.
 */
class SimplePdf
{
    private const PAGE_WIDTH = 612.0;

    private const PAGE_HEIGHT = 792.0;

    private const MARGIN_LEFT = 50.0;

    private const MARGIN_RIGHT = 50.0;

    private const MARGIN_TOP = 50.0;

    private const MARGIN_BOTTOM = 50.0;

    private const LINE_HEIGHT = 14.0;

    /** @var list<string> */
    private array $pageStreams = [];

    private string $currentStream = '';

    private float $y;

    public function __construct()
    {
        $this->y = self::PAGE_HEIGHT - self::MARGIN_TOP;
    }

    public function title(string $text): self
    {
        $this->ensureSpace(28);
        $this->writeText($text, self::MARGIN_LEFT, $this->y, 18, true);
        $this->y -= 26;

        return $this;
    }

    public function subtitle(string $text): self
    {
        $this->ensureSpace(18);
        $this->writeText($text, self::MARGIN_LEFT, $this->y, 11, false);
        $this->y -= 18;

        return $this;
    }

    public function heading(string $text): self
    {
        $this->ensureSpace(22);
        $this->y -= 6;
        $this->writeText($text, self::MARGIN_LEFT, $this->y, 13, true);
        $this->y -= 4;
        $this->drawLine($this->y);
        $this->y -= 16;

        return $this;
    }

    public function blank(float $points = 8.0): self
    {
        $this->y -= $points;

        return $this;
    }

    public function text(string $text, bool $bold = false, float $size = 10.0): self
    {
        $this->ensureSpace(self::LINE_HEIGHT + 2);
        $this->writeText($text, self::MARGIN_LEFT, $this->y, $size, $bold);
        $this->y -= self::LINE_HEIGHT;

        return $this;
    }

    /**
     * @param  list<array{text: string, width: float, align?: 'left'|'right', bold?: bool}>  $columns
     */
    public function row(array $columns, float $size = 10.0): self
    {
        $this->ensureSpace(self::LINE_HEIGHT + 2);
        $x = self::MARGIN_LEFT;

        foreach ($columns as $column) {
            $align = $column['align'] ?? 'left';
            $bold = $column['bold'] ?? false;
            $width = $column['width'];
            $text = $column['text'];

            if ($align === 'right') {
                $textWidth = $this->estimateTextWidth($text, $size, $bold);
                $this->writeText($text, $x + $width - $textWidth, $this->y, $size, $bold);
            } else {
                $this->writeText($text, $x, $this->y, $size, $bold);
            }

            $x += $width;
        }

        $this->y -= self::LINE_HEIGHT;

        return $this;
    }

    public function render(): string
    {
        $this->flushPage();

        $objects = [];
        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';

        $pageCount = count($this->pageStreams);
        $kids = [];
        $nextObjectId = 3;

        $fontRegularId = $nextObjectId++;
        $fontBoldId = $nextObjectId++;
        $objects[$fontRegularId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        $objects[$fontBoldId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

        $pageObjectIds = [];
        $contentObjectIds = [];

        for ($i = 0; $i < $pageCount; $i++) {
            $pageObjectIds[$i] = $nextObjectId++;
            $contentObjectIds[$i] = $nextObjectId++;
            $kids[] = $pageObjectIds[$i].' 0 R';
        }

        $objects[2] = sprintf(
            '<< /Type /Pages /Kids [%s] /Count %d >>',
            implode(' ', $kids),
            $pageCount
        );

        for ($i = 0; $i < $pageCount; $i++) {
            $stream = $this->pageStreams[$i];
            $objects[$contentObjectIds[$i]] = sprintf(
                "<< /Length %d >>\nstream\n%s\nendstream",
                strlen($stream),
                $stream
            );
            $objects[$pageObjectIds[$i]] = sprintf(
                '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %.0f %.0f] /Contents %d 0 R /Resources << /Font << /F1 %d 0 R /F2 %d 0 R >> >> >>',
                self::PAGE_WIDTH,
                self::PAGE_HEIGHT,
                $contentObjectIds[$i],
                $fontRegularId,
                $fontBoldId
            );
        }

        ksort($objects);

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $id => $body) {
            $offsets[$id] = strlen($pdf);
            $pdf .= $id." 0 obj\n".$body."\nendobj\n";
        }

        $xrefPos = strlen($pdf);
        $maxId = max(array_keys($objects));
        $pdf .= "xref\n0 ".($maxId + 1)."\n";
        $pdf .= "0000000000 65535 f \n";

        for ($id = 1; $id <= $maxId; $id++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$id] ?? 0);
        }

        $pdf .= "trailer\n<< /Size ".($maxId + 1)." /Root 1 0 R >>\n";
        $pdf .= "startxref\n".$xrefPos."\n%%EOF";

        return $pdf;
    }

    private function ensureSpace(float $needed): void
    {
        if ($this->y - $needed < self::MARGIN_BOTTOM) {
            $this->flushPage();
            $this->y = self::PAGE_HEIGHT - self::MARGIN_TOP;
        }
    }

    private function flushPage(): void
    {
        if ($this->currentStream === '' && $this->pageStreams !== []) {
            return;
        }

        $this->pageStreams[] = $this->currentStream;
        $this->currentStream = '';
    }

    private function drawLine(float $y): void
    {
        $x2 = self::PAGE_WIDTH - self::MARGIN_RIGHT;
        $this->currentStream .= sprintf(
            "q 0.6 w %.2f %.2f m %.2f %.2f l S Q\n",
            self::MARGIN_LEFT,
            $y,
            $x2,
            $y
        );
    }

    private function writeText(string $text, float $x, float $y, float $size, bool $bold): void
    {
        $font = $bold ? '/F2' : '/F1';
        $escaped = $this->escapePdfString($this->toWinAnsi($text));
        $this->currentStream .= sprintf(
            "BT %s %.2f Tf %.2f %.2f Td (%s) Tj ET\n",
            $font,
            $size,
            $x,
            $y,
            $escaped
        );
    }

    private function estimateTextWidth(string $text, float $size, bool $bold): float
    {
        // Approximate average glyph width for Helvetica.
        $factor = $bold ? 0.55 : 0.5;

        return strlen($this->toWinAnsi($text)) * $size * $factor;
    }

    private function escapePdfString(string $text): string
    {
        return str_replace(
            ['\\', '(', ')'],
            ['\\\\', '\\(', '\\)'],
            $text
        );
    }

    /**
     * Convert UTF-8 to WinAnsi (ISO-8859-1 subset) for Helvetica.
     */
    private function toWinAnsi(string $text): string
    {
        $converted = @iconv('UTF-8', 'Windows-1252//TRANSLIT//IGNORE', $text);

        if ($converted === false) {
            return preg_replace('/[^\x20-\x7E]/', '?', $text) ?? $text;
        }

        return $converted;
    }
}
