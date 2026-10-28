import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
from datetime import datetime

DATABASE_URL = os.environ.get("DATABASE_URL")


def database_setup():
    """
    Sets up the DB for first time-use
    """

    sql_commands = """

        CREATE TABLE IF NOT EXISTS Rides (
            id SERIAL PRIMARY KEY,
            admin_netid VARCHAR(20),
            admin_name VARCHAR(50),
            admin_email VARCHAR(50),
            max_capacity INTEGER CHECK (max_capacity BETWEEN 1 AND 20) NOT NULL,
            origin_dict JSONB NOT NULL,
            destination_dict JSONB NOT NULL,
            arrival_time TIMESTAMP NOT NULL,
            creation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            current_riders TEXT[][],
            note VARCHAR(250)
        );

        CREATE TABLE IF NOT EXISTS RideRequests (
            id SERIAL PRIMARY KEY,
            netid VARCHAR(10),
            full_name TEXT,
            mail VARCHAR(30),
            ride_id INTEGER REFERENCES Rides(id),
            status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'rejected', 'removed')) NOT NULL,
            request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            response_time TIMESTAMP,
            note VARCHAR(300)
        );

        CREATE TABLE IF NOT EXISTS Notifications (
            id SERIAL PRIMARY KEY,
            netid VARCHAR(20),
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            notification_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(10)
        );

        -- Bring existing databases up to date. Every statement here must be
        -- safe to re-run, since this block runs on each startup.
        ALTER TABLE Notifications ADD COLUMN IF NOT EXISTS status VARCHAR(10);
        ALTER TABLE RideRequests ADD COLUMN IF NOT EXISTS note VARCHAR(300);
        ALTER TABLE RideRequests DROP CONSTRAINT IF EXISTS riderequests_status_check;
        ALTER TABLE RideRequests ADD CONSTRAINT riderequests_status_check
            CHECK (status IN ('pending', 'accepted', 'rejected', 'removed'));
    """
    # Connect
    conn = connect()

    # if it was successful connection, execute SQL commands to database & commit
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_commands)
                conn.commit()
                print("Tables created successfully!")
        except Exception as e:
            print(f"Error creating tables: {e}")
        finally:
            conn.close()
    else:
        print("Connection not established.")


def connect():
    """
    Establishes connection to PostgreSQL database via psycopg2
    """
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("Connected to the database successfully!")
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        return None


def create_ride(
    admin_netid,
    admin_name,
    admin_email,
    max_capacity,
    origin,
    destination,
    arrival_time,
    note="",
):
    """
    Adds a ride to the Rides database
    """

    current_riders = []

    sql_command = f"""
        INSERT INTO Rides (admin_netid, admin_name, admin_email, max_capacity, current_riders,
        origin_dict, destination_dict, arrival_time, note, updated_at) VALUES (%s, %s, %s, %s, 
        %s, %s, %s, %s, %s, CURRENT_TIMESTAMP);   
    """

    values = (
        admin_netid,
        admin_name,
        admin_email,
        max_capacity,
        current_riders,
        origin,
        destination,
        arrival_time,
        note,
    )

    conn = connect()

    # if it was successful connection, execute SQL commands to database & commit
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, values)
                conn.commit()
                print("Ride addded successfully!")
        except Exception as e:
            print(f"Error adding ride: {e}")
        finally:
            conn.close()
    else:
        print("Connection not established.")


def delete_ride(netid, ride_id):
    """
    Delete a ride in the Rides database and any associated Ride Requests
    """

    ride_sql_command = """ 
        DELETE FROM Rides
        WHERE admin_netid = %s AND id = %s;
    """

    ride_values = (netid, ride_id)

    ride_request_sql_command = """
        DELETE FROM RideRequests
        WHERE ride_id = %s;
    """

    ride_request_values = (ride_id,)

    conn = connect()

    # if it was successful connection, execute SQL commands to database & commit
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(ride_request_sql_command, ride_request_values)
                cursor.execute(ride_sql_command, ride_values)
                conn.commit()
                print("Ride deleted successfully!")
        except Exception as e:
            print(f"Error deleting ride: {e}")
        finally:
            conn.close()
    else:
        print("Connection not established.")


def create_ride_request(netid, full_name, mail, ride_id, note=None):
    """
    Adds a pending ride request to RideRequests. A rider who was removed
    from the ride may request again, which reopens their old request.

    Returns True if a request was created or reopened, False if the rider
    already has an active or rejected request for this ride.
    """

    sql_existing = """
        SELECT status FROM RideRequests WHERE netid = %s AND ride_id = %s;
    """

    sql_insert = """
        INSERT INTO RideRequests (netid, full_name, mail, ride_id, status, note, request_time)
        VALUES (%s, %s, %s, %s, 'pending', %s, CURRENT_TIMESTAMP);
    """

    sql_reopen = """
        UPDATE RideRequests
        SET status = 'pending', note = %s, request_time = CURRENT_TIMESTAMP,
            response_time = NULL
        WHERE netid = %s AND ride_id = %s AND status = 'removed';
    """

    created = False
    conn = connect()

    # if it was successful connection, execute SQL commands to database & commit
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_existing, (netid, ride_id))
                existing = cursor.fetchone()

                if existing is None:
                    cursor.execute(sql_insert, (netid, full_name, mail, ride_id, note))
                    created = True
                elif existing[0] == "removed":
                    cursor.execute(sql_reopen, (note, netid, ride_id))
                    created = cursor.rowcount > 0
                else:
                    print("Request already exists.")

                conn.commit()
                if created:
                    print("Ride request addded successfully!")

        except Exception as e:
            print(f"Error adding ride request: {e}")
        finally:
            conn.close()
    else:
        print("Connection not established.")

    return created


def update_capacity(rideid, new_capacity):
    """
    Updates the capacity of a ride
    """

    sql_command = f"""
        UPDATE Rides
        SET max_capacity = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s;
    """

    values = (new_capacity, rideid)

    conn = connect()

    # if it was successful connection, execute SQL commands to database & commit
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, values)
                conn.commit()
                print("Ride capacity updated successfully!")
        except Exception as e:
            print(f"Error updating ride capacity: {e}")
        finally:
            conn.close()


def update_arrival_time(rideid, new_arrival_time):
    """
    Updates the arrival time of a ride
    """
    sql_command = f"""
        UPDATE Rides
        SET arrival_time = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s;
    """
    values = (new_arrival_time, rideid)
    conn = connect()
    # if it was successful connection, execute SQL commands to database & commit
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, values)
                conn.commit()
                print("Ride arrival time updated successfully!")
        except Exception as e:
            print(f"Error updating ride arrival time: {e}")
        finally:
            conn.close()


def get_users_rides(netid):
    """
    Get all of a user's rides from Rides database
    """

    sql_command = """
        SELECT 
            Rides.id, 
            Rides.admin_netid, 
            Rides.admin_name,
            Rides.admin_email,
            Rides.max_capacity, 
            Rides.origin_dict, 
            Rides.destination_dict, 
            Rides.arrival_time, 
            Rides.creation_time, 
            Rides.updated_at, 
            Rides.note,
            Rides.current_riders, 
            COALESCE(ARRAY_AGG(
                CASE 
                    WHEN RideRequests.netid IS NULL THEN NULL 
                    ELSE ARRAY[RideRequests.netid, RideRequests.full_name, RideRequests.mail, RideRequests.note]
                END
            ) FILTER (WHERE RideRequests.netid IS NOT NULL), ARRAY[]::text[][]) AS riderequesters
        FROM 
            Rides 
        LEFT JOIN 
            RideRequests ON RideRequests.ride_id = Rides.id AND RideRequests.status = 'pending'
        WHERE 
            Rides.admin_netid = %s
        GROUP BY 
            Rides.id, 
            Rides.admin_netid, 
            Rides.admin_name,
            Rides.admin_email,
            Rides.max_capacity, 
            Rides.origin_dict, 
            Rides.destination_dict, 
            Rides.arrival_time, 
            Rides.creation_time, 
            Rides.updated_at, 
            Rides.note,
            Rides.current_riders;
    """

    values = (str(netid),)
    rides = []

    conn = connect()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, values)
                rides = cursor.fetchall()
                print("Rides retrieved successfully!")
        except Exception as e:
            print(f"Error retrieving rides: {e}")
        finally:
            conn.close()
    else:
        print("Connection not established.")

    return rides


def get_all_rides():

    sql_command = """
    SELECT id, admin_netid, admin_name, admin_email, max_capacity, origin_dict,
    destination_dict, arrival_time, creation_time, updated_at, current_riders, note FROM Rides
    """
    conn = connect()

    rides = []

    # if it was successful connection, execute SQL commands to database & commit
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command)
                rides = cursor.fetchall()
                print("Rides retrieved successfully!")
        except Exception as e:
            print(f"Error retrieving rides: {e}")
        finally:
            conn.close()
    else:
        print("Connection not established.")

    return rides


def search_rides(
    origin_id=None, destination_id=None, arrival_time=None, start_search_time=None
):
    query = """
        SELECT id, admin_netid, admin_name, admin_email, max_capacity, origin_dict, 
        destination_dict, arrival_time, creation_time, updated_at, current_riders, note FROM Rides
        WHERE 1=1
    """

    conn = connect()
    values = []

    if origin_id:
        query += " AND origin_dict->>'id' = %s"
        values.append(origin_id)
    if destination_id:
        query += " AND destination_dict->>'id' = %s"
        values.append(destination_id)

    # start_search_time is arrive after
    if start_search_time:
        query += " AND arrival_time >= %s"
        values.append(start_search_time)
    else:
        query += " AND arrival_time >= %s"
        values.append(datetime.now())
    # arrival_time is arrive before
    if arrival_time:
        query += " AND arrival_time <= %s"
        values.append(arrival_time)

    if not (origin_id or destination_id or start_search_time or arrival_time):
        raise ValueError(
            "At least one of origin, destination, start time, or end time must be provided."
        )

    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, values)
                rides = cursor.fetchall()
                cursor.close()
                conn.close()
        except Exception as e:
            print(f"Error retrieving locations: {e}")
        finally:
            conn.close()
    else:
        print("Connection not established.")

    return rides


def get_users_requested_rides(netid):
    """
    Get all of a user's REQUESTED rides from RideRequests database and its associated status
    """

    sql_command = """
        SELECT Rides.id, admin_netid, admin_name, admin_email, max_capacity, origin_dict, destination_dict, 
            arrival_time, creation_time, updated_at, Rides.note, 
            current_riders, RideRequests.status as ride_request_status
        FROM Rides
        JOIN RideRequests ON Rides.id = RideRequests.ride_id
        WHERE RideRequests.netid = %s;
        """

    values = (str(netid),)
    req_rides = []

    conn = connect()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, values)
                req_rides = cursor.fetchall()
                print("RideRequests retrieved successfully!")
        except Exception as e:
            print(f"Error retrieving ride requests: {e}")
        finally:
            conn.close()
    else:
        print("Connection not established.")

    return req_rides


def delete_ride_request(netid, ride_id):
    """
    Deletes a rider's pending request for ride_id (i.e. the rider cancels).

    Returns True if a pending request was deleted.
    """
    sql_command = """
        DELETE FROM RideRequests
        WHERE netid = %s AND ride_id = %s AND status = 'pending';
    """

    values = (str(netid), ride_id)
    deleted = False

    conn = connect()

    # if it was successful connection, execute SQL commands to database & commit
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, values)
                deleted = cursor.rowcount > 0
                conn.commit()
                print("RideRequest deleted successfully!")
        except Exception as e:
            print(f"Error deleting ride: {e}")
        finally:
            conn.close()
    else:
        print("Connection not established.")

    return deleted


def accept_ride_request(user_netid, full_name, mail, ride_id):
    """
    Accepts a pending ride request and adds the rider to current_riders.

    Returns True if the request was newly accepted. Returns False if there is
    no pending request (e.g. the rider is already accepted, or cancelled) or
    the ride is already full.
    """

    sql_has_seat = """
        SELECT 1 FROM Rides
        WHERE id = %s AND COALESCE(array_length(current_riders, 1), 0) < max_capacity
        FOR UPDATE;
    """

    update_ride_requests_sql_command = """
        UPDATE RideRequests
        SET status = 'accepted', response_time = CURRENT_TIMESTAMP
        WHERE netid = %s AND ride_id = %s AND status = 'pending';
    """

    update_rides_sql_command = """
        UPDATE Rides
        SET current_riders = array_cat(current_riders, ARRAY[ARRAY[%s, %s, %s]]),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = %s;
    """

    accepted = False
    conn = connect()

    # if it was successful connection, execute SQL commands to database & commit
    if conn:
        try:
            with conn.cursor() as cursor:
                # locks the ride row so two accepts can't both take the last seat
                cursor.execute(sql_has_seat, (ride_id,))
                if cursor.fetchone() is None:
                    print("Ride is full; request not accepted.")
                else:
                    cursor.execute(update_ride_requests_sql_command, (user_netid, ride_id))
                    if cursor.rowcount > 0:
                        cursor.execute(
                            update_rides_sql_command, (user_netid, full_name, mail, ride_id)
                        )
                        accepted = True
                conn.commit()
                if accepted:
                    print("RideRequest accepted successfully!")
        except Exception as e:
            conn.rollback()
            print(f"Error accepting ride request: {e}")
        finally:
            conn.close()
    else:
        print("Connection not established.")

    return accepted


def reject_ride_request(user_netid, ride_id):
    """
    Rejects a pending ride request. Also covers a rider the poster removed
    and then rejected before saving, who is still 'accepted' at this point.

    Returns the rider's email if the request was newly rejected, else None.
    """
    sql_command = """
        UPDATE RideRequests
        SET status = 'rejected', response_time = CURRENT_TIMESTAMP
        WHERE netid = %s AND ride_id = %s AND status IN ('pending', 'accepted')
        RETURNING mail;
        """

    values = (user_netid, ride_id)
    mail = None

    conn = connect()

    # if it was successful connection, execute SQL commands to database & commit
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, values)
                row = cursor.fetchone()
                conn.commit()
                if row:
                    mail = row[0] or ""
                    print("RideRequest rejected successfully!")
        except Exception as e:
            print(f"Error rejecting ride request: {e}")
        finally:
            conn.close()

        if mail is not None:
            remove_from_current_riders(ride_id, user_netid)
    else:
        print("Connection not established.")

    return mail


def get_all_my_ride_requests(netid):
    sql_command = """
            SELECT netid, ride_id, status FROM RideRequests
            WHERE netid = %s;
    """
    requests = []
    values = (netid,)

    conn = connect()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, values)
                requests = cursor.fetchall()
                print("Ride requests retrieved successfully!")
        except Exception as e:
            print(f"Error retrieving requests: {e}")
        finally:
            conn.close()
    else:
        print("Connection not established.")

    return requests


def remove_from_current_riders(ride_id, requester_id):
    conn = connect()

    try:
        with conn.cursor() as cursor:

            cursor.execute(
                "SELECT current_riders FROM Rides WHERE id = %s;", (ride_id,)
            )
            result = cursor.fetchone()

            if result is None:
                print(f"No record found for ride_id {ride_id}")
                return

            current_riders = result[0]  # This should be a 2D array (list of lists)

            # Remove the matching sub-array from current_riders
            current_riders = [
                rider for rider in current_riders if not (rider[0] == requester_id)
            ]

            cursor.execute(
                "UPDATE Rides SET current_riders = %s WHERE id = %s;",
                (current_riders, ride_id),
            )
            conn.commit()
            print("Ride's current_riders updated successfully!")
    except Exception as e:
        print(f"Error updating current_riders: {e}")
    finally:
        conn.close()


def remove_rider(requester_id, ride_id):
    """
    Removes an accepted rider from a ride. Their request is marked 'removed',
    which they see in My Rides, and they may request to join again.

    Returns the rider's email if they were removed, else None (e.g. the
    rider wasn't accepted).
    """

    sql_command_ride_requests = """
        UPDATE RideRequests
        SET status = 'removed', response_time = CURRENT_TIMESTAMP
        WHERE netid = %s AND ride_id = %s AND status = 'accepted'
        RETURNING mail;
        """
    values_ride_requests = (requester_id, ride_id)
    mail = None

    conn = connect()

    # if it was successful connection, execute SQL commands to database & commit
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command_ride_requests, values_ride_requests)
                row = cursor.fetchone()
                conn.commit()
                if row:
                    mail = row[0] or ""
                    print("RideRequest marked REMOVED successfully!")
        except Exception as e:
            print(f"Error removing ride request: {e}")
        finally:
            conn.close()

        if mail is not None:
            remove_from_current_riders(ride_id, requester_id)
    else:
        print("Connection not established.")

    return mail


def rideid_to_admin_id_email(ride_id):
    """
    Given a rideid, returns admin_netid and email
    """
    sql_command = "SELECT admin_netid, admin_email FROM Rides WHERE id = %s"
    values = (ride_id,)
    admin_netid_result = None
    admin_mail_result = None

    conn = connect()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, values)
                result = cursor.fetchone()
                if result:
                    admin_netid_result = result[0]
                    admin_mail_result = result[1]
                    print("Admin_netid retrieved successfully:", admin_netid_result)
                else:
                    print("No matching admin_netid found.")
        except Exception as e:
            print(f"Error retrieving admin_netid: {e}")
        finally:
            conn.close()
    else:
        print("Connection not established.")

    return (admin_netid_result, admin_mail_result) if admin_netid_result else None


def get_pending_requests(ride_id):
    """
    Returns (netid, full_name, mail, note) for each pending request on a ride
    """
    sql_command = """
        SELECT netid, full_name, mail, note FROM RideRequests
        WHERE ride_id = %s AND status = 'pending'
        ORDER BY request_time;
    """

    conn = connect()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, (ride_id,))
                return cursor.fetchall()
        except Exception as e:
            print(f"Error fetching pending requests: {e}")
        finally:
            conn.close()
    else:
        print("Connection not established.")
    return []


def get_ride_summary(ride_id):
    """
    Returns (admin_netid, admin_email, origin name, destination name,
    arrival_time) for a ride, or None if it doesn't exist. Used for
    notification text when the client doesn't send it.
    """
    sql_command = """
        SELECT admin_netid, admin_email, origin_dict->>'name',
            destination_dict->>'name', arrival_time
        FROM Rides WHERE id = %s;
    """

    conn = connect()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, (ride_id,))
                return cursor.fetchone()
        except Exception as e:
            print(f"Error fetching ride summary: {e}")
        finally:
            conn.close()
    else:
        print("Connection not established.")
    return None


def get_user_notifs(netid):
    """
    Given user's netid, finds that user's notifs
    """
    sql_command = """
            SELECT id, message, notification_time, subject, status
            FROM Notifications 
            WHERE netid = %s
            ORDER BY notification_time DESC
        """
    values = (netid,)

    conn = connect()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, values)
                result = cursor.fetchall()
                return result
        except Exception as e:
            print(f"Error fetching notifications: {e}")
            return None  # meaning error
        finally:
            conn.close()
    else:
        print("Failed to establish a database connection.")
        return None


def add_notification(netid, subject, message):
    """
    Adds the relevant message to notification table
    """
    sql_command = """
            INSERT INTO Notifications (netid, message, notification_time, subject)
            VALUES (%s, %s, CURRENT_TIMESTAMP, %s)
        """
    values = (netid, message, subject)

    conn = connect()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, values)
                conn.commit()
                print("Notification added successfully.")
                return True
        except Exception as e:
            print(f"Error adding to notifications: {e}")
            return None  # meaning error
        finally:
            conn.close()
    else:
        print("Failed to establish a database connection.")
        return None


def read_notification(netid, notif_id):
    """
    Given user's netid and notif_id, marks that notif as read
    """
    sql_command = """
            UPDATE Notifications
            SET status = 'read'
            WHERE netid = %s AND id = %s
        """
    values = (netid, notif_id)

    conn = connect()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, values)
                conn.commit()
                print("Notification marked as read successfully.")
                return True
        except Exception as e:
            print(f"Error marking notification as read: {e}")
            return None  # meaning error
        finally:
            conn.close()
    else:
        print("Failed to establish a database connection.")
        return None


def read_all_users_notifications(netid):
    """
    Marks all notifications as read
    """
    sql_command = """
            UPDATE Notifications
            SET status = 'read'
            WHERE netid = %s
        """

    values = (netid,)

    conn = connect()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, values)
                conn.commit()
                print("All notifications marked as read successfully.")
                return True
        except Exception as e:
            print(f"Error marking all notifications as read: {e}")
            return None  # meaning error
        finally:
            conn.close()
    else:
        print("Failed to establish a database connection.")
        return None


def clear_all_users_notifications(netid):
    """
    Deletes all of a user's notifications
    """
    sql_command = """
            DELETE FROM Notifications
            WHERE netid = %s
        """

    values = (netid,)

    conn = connect()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql_command, values)
                conn.commit()
                print("All notifications cleared successfully.")
                return True
        except Exception as e:
            print(f"Error clearing notifications: {e}")
            return None  # meaning error
        finally:
            conn.close()
    else:
        print("Failed to establish a database connection.")
        return None


if __name__ == "__main__":
    database_setup()
