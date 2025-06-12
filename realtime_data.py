import time
import requests

API_URL = 'https://api.github.com/events'


def fetch_events():
    response = requests.get(API_URL, headers={'Accept': 'application/vnd.github.v3+json'})
    response.raise_for_status()
    return response.json()


def display_events(events):
    for event in events:
        repo = event.get('repo', {}).get('name', 'unknown')
        etype = event.get('type')
        created_at = event.get('created_at')
        print(f"{created_at} - {etype} in {repo}")


def main(interval=60):
    print('Fetching GitHub public events. Press Ctrl+C to stop.')
    try:
        while True:
            events = fetch_events()
            display_events(events[:5])  # show first 5 events
            time.sleep(interval)
    except KeyboardInterrupt:
        print('\nStopped.')


if __name__ == '__main__':
    main()
