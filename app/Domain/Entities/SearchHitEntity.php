<?php

namespace App\Domain\Entities;

readonly class SearchHitEntity
{
    public function __construct(
        public string $type,
        public int|string $id,
        public string $title,
        public ?string $subtitle,
        public string $url,
    ) {}

    /**
     * @return array{type: string, id: int|string, title: string, subtitle: string|null, url: string}
     */
    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'id' => $this->id,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'url' => $this->url,
        ];
    }
}
