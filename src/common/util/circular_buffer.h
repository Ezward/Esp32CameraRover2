#ifndef CIRCULAR_BUFFER_H
#define CIRCULAR_BUFFER_H

#include <assert.h>

/**
 * Manage a circular buffer of values.
 * Values can be continually pushed onto the head of the list,
 * and values will be dropped from tail of list to make room
 * if necessary.
 */
template <class T> class CircularBuffer {
    private:
    T *_buffer;
    T *_ownedBuffer;
    T _defaultValue;
    const unsigned int _capacity;
    unsigned int _count = 0;
    unsigned int _tail = 0;

    public:

    /**
     * Construct instance to manage provided buffer as a circular buffer
     */
    CircularBuffer(
        T *borrowedBuffer,     // IN : buffer to manage - MUST exist for life of instance
        unsigned int capacity, // IN : non-zero number of total elements in the buffer
        T& defaultValue)        // IN : the default value if the list is empty
        : _buffer(borrowedBuffer), _ownedBuffer(nullptr), _defaultValue(defaultValue), _capacity(capacity)
    {
        // no-op
        assert (nullptr != borrowedBuffer);
        assert (capacity > 0);

        memset(_buffer, 0, sizeof(T) * capacity);
    }

    /**
     * Construct instance that owns the circular buffer
     */
    CircularBuffer(
        unsigned int capacity, // IN : non-zero number of total elements in the buffer
        T& defaultValue)        // IN : the default value if the list is empty
        : _capacity(capacity), _defaultValue(defaultValue)
    {
        // no-op
        assert (capacity > 0);

        _buffer = _ownedBuffer = new T[_capacity];
        memset(_buffer, 0, sizeof(T) * capacity);
    }

    /**
     * If we created the buffer, then delete it
     */
    ~CircularBuffer() {
        if(nullptr != _ownedBuffer) {
            delete _ownedBuffer;
        }
    }

    /**
     * Return the capacity provided in the constructor
     */
    unsigned int capacity() // RET: buffer's total capacity
    {
        return _capacity;
    }

    /**
     * The defaultValue returned if the list is empty
     */
    T& defaultValue()    // RET: the default value returned if the list is empty
    {
        return _defaultValue;
    }

    /**
     * Get the number of filled entries in the buffer
     */
    unsigned int count()    // RET: number of filled entries in buffer
    {
        return _count;
    }

    /**
     * Get the number of available (empty) entries in the buffer.
     */
    unsigned int available()    // RET: number of available entries in buffer
    {
        return _capacity - _count;
    }

    /**
     * Non-destructive get of the entry at the head (most recently added value)
     */
    T& head()   // RET: if list is not empty, the head (most recent) entry.
                //      if list is empty, the default value provided in the constructor
    {
        if(_count > 0) {
            return _buffer[(_tail + _count - 1) % _capacity];
        }
        return _defaultValue;
    }

    /**
     * Non-destructive get of the entry at the tail (least recently added value)
     */
    T& tail()// RET: if list is not empty, the tail (least recent) entry.
            //      if list is empty, the default value provided in the constructor
    {
        if(_count > 0) {
            return _buffer[_tail];
        }
        return _defaultValue;
    }

    /**
     * Push a value onto the head of the buffer.  
     * If the buffer is full, then the value 
     * at the tail is dropped to make room.
     */
    void push(T &theValue)   // IN : the value to add at the head of the buffer
    {
        if(_count < _capacity) {
            _count += 1;
        } else {
            // drop entry at the tail
            _tail = (_tail + 1) % _capacity;
        }

        // write value at head
        _buffer[(_tail + _count - 1) % _capacity] = theValue;
    }

    /**
     * Remove value at head of list and return it
     */
    T pop() // RET: if list not empty, the value at head 
            //      if list empty, the default value
    {
        T& theValue = head();
        if(_count > 0) {
            _count -= 1;
        }
        return theValue;
    }

    /**
     * Remove value at tail of list and return it
     */
    T dequeue() // RET: if list not empty, value at tail
                //      if list empty, the default value
    {
        T& theValue = tail();
        if(_count > 0) {
            _count -= 1;
            _tail = (_tail + 1) % _capacity;
        }
        return theValue;
    }

    /**
     * Get value at given index where
     * tail is index 0 and head is is index count-1;
     */
    T& get(int i)   // IN : index from 0 to count-1 (tail is zero)
                    // RET: value at index
                    //      or the default value if index is out of range
    {
        if((i >= 0) && (i < _count)) {
            return _buffer[(_tail + i) % _capacity];
        }

        return _defaultValue;
    }

    /**
     * Set value at given index where
     * tail is index 0 and head is is index count-1;
     * 
     * NOTE: fails silently if index is out of range.
     */
    void set(
        int i,         // IN : index from 0 to count-1 (tail is zero)
        T& theValue)   // IN : value to set
    {
        if((i >= 0) && (i < _count)) {
            return _buffer[(_tail + i) % _capacity] = theValue;
        }
    }


    /**
     * Truncate the list to the given number of values.
     * If the given size is greater than or equal to
     * the current count(), then nothing is changed.
     * If the given size is less than the 
     * current count(), then elements are dropped
     * from the tail to resize to the given size.
     * 
     * So to drop all entries except the head:
     *   truncateTo(1)
     */
    void truncateTo(unsigned int size)    // IN : the desired size (maximum)
    {
        if(size <= _count) {
            _count = size;
            _tail = (_tail + size) % _capacity;
        }
    }

};




/**
 * Manage a circular buffer of values.
 * Values can be continually pushed onto the head of the list,
 * and values will be dropped from tail of list to make room
 * if necessary.
 */



#endif // CIRCULAR_BUFFER_H