<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ScheduleEventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:from',
            ],
        ]);

        $maximumDate = CarbonImmutable::parse($validated['from'])
            ->addDays(30)
            ->toDateString();

        $request->validate([
            'to' => ['before_or_equal:'.$maximumDate],
        ]);

        $from = CarbonImmutable::parse(
            $validated['from'],
            'Europe/Rome'
        )->startOfDay()->utc();

        $until = CarbonImmutable::parse(
            $validated['to'],
            'Europe/Rome'
        )->addDay()->startOfDay()->utc();

        $events = $request->user()
            ->scheduleEvents()
            ->where('starts_at', '<', $until)
            ->where('ends_at', '>', $from)
            ->orderBy('starts_at')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $events,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:work,commitment'],
            'title' => ['nullable', 'string', 'max:255'],
            'starts_at' => ['required', 'date_format:Y-m-d\TH:i:s.v\Z'],
            'ends_at' => ['required', 'date_format:Y-m-d\TH:i:s.v\Z', 'after:starts_at'],
        ]);

        $validated['starts_at'] = CarbonImmutable::parse($validated['starts_at'])
            ->utc()->toDateTimeString();
        $validated['ends_at'] = CarbonImmutable::parse($validated['ends_at'])
            ->utc()->toDateTimeString();

        $event = $request->user()->scheduleEvents()->create($validated);

        return response()->json(['data' => $event], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $event = $request->user()->scheduleEvents()->findOrFail($id);

        $validated = $request->validate([
            'type' => ['required', 'in:work,commitment'],
            'title' => ['nullable', 'string', 'max:255'],
            'starts_at' => ['required', 'date_format:Y-m-d\TH:i:s.v\Z'],
            'ends_at' => ['required', 'date_format:Y-m-d\TH:i:s.v\Z', 'after:starts_at'],
        ]);

        $validated['starts_at'] = CarbonImmutable::parse($validated['starts_at'])
            ->utc()->toDateTimeString();
        $validated['ends_at'] = CarbonImmutable::parse($validated['ends_at'])
            ->utc()->toDateTimeString();
        $validated['title'] = $validated['title'] ?? null;

        $event->update($validated);

        return response()->json(['data' => $event]);
    }

    public function destroy(Request $request, int $id): Response
    {
        $event = $request->user()->scheduleEvents()->findOrFail($id);
        $event->delete();

        return response()->noContent();
    }
}
