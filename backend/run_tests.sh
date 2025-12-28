#!/bin/bash

# Test Runner Script for Driver Finance App
# This script provides convenient commands for running tests

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Check if PostgreSQL is running
check_postgres() {
    print_info "Checking PostgreSQL connection..."
    
    if command -v pg_isready &> /dev/null; then
        if pg_isready -h localhost -p 5432 &> /dev/null; then
            print_success "PostgreSQL is running"
            return 0
        else
            print_warning "PostgreSQL is not responding"
            return 1
        fi
    else
        print_warning "pg_isready not found, skipping PostgreSQL check"
        return 0
    fi
}

# Check if dependencies are installed
check_dependencies() {
    print_info "Checking test dependencies..."
    
    if python -c "import pytest" 2>/dev/null; then
        print_success "Test dependencies are installed"
        return 0
    else
        print_error "Test dependencies not found!"
        print_info "Run: pip install -r requirements.txt"
        return 1
    fi
}

# Display usage information
usage() {
    cat << EOF
${BLUE}Test Runner for Driver Finance App${NC}

Usage: ./run_tests.sh [OPTION]

Options:
    all, -a              Run all tests (default)
    auth                 Run authentication tests only
    fast, -f             Run tests without coverage
    coverage, -c         Run tests with coverage report
    watch, -w            Run tests in watch mode (requires pytest-watch)
    verbose, -v          Run tests with verbose output
    debug, -d            Run tests with debug output
    failed, -lf          Run only last failed tests
    help, -h             Show this help message

Examples:
    ./run_tests.sh                    # Run all tests
    ./run_tests.sh auth               # Run auth tests only
    ./run_tests.sh coverage           # Run with coverage
    ./run_tests.sh -v                 # Verbose output

EOF
}

# Run all tests
run_all_tests() {
    print_info "Running all tests..."
    pytest
    print_success "All tests completed!"
}

# Run authentication tests only
run_auth_tests() {
    print_info "Running authentication tests..."
    pytest tests/api/v1/test_auth.py -v
    print_success "Authentication tests completed!"
}

# Run tests with coverage
run_with_coverage() {
    if python -c "import pytest_cov" 2>/dev/null; then
        print_info "Running tests with coverage..."
        pytest --cov=app --cov-report=html --cov-report=term-missing
        print_success "Coverage report generated in htmlcov/index.html"
    else
        print_warning "pytest-cov not installed"
        print_info "Install with: pip install pytest-cov"
        print_info "Running tests without coverage..."
        pytest
    fi
}

# Run tests in watch mode
run_watch_mode() {
    if python -c "import pytest_watch" 2>/dev/null; then
        print_info "Running tests in watch mode (Ctrl+C to exit)..."
        ptw -- -v
    else
        print_warning "pytest-watch not installed"
        print_info "Install with: pip install pytest-watch"
        exit 1
    fi
}

# Run tests with verbose output
run_verbose() {
    print_info "Running tests with verbose output..."
    pytest -vv --showlocals
}

# Run tests with debug output
run_debug() {
    print_info "Running tests with debug output..."
    pytest -vv --showlocals -s --log-cli-level=DEBUG
}

# Run only last failed tests
run_last_failed() {
    print_info "Running last failed tests..."
    pytest --lf -v
}

# Main script logic
main() {
    # Change to script directory
    cd "$(dirname "$0")"
    
    # Check prerequisites
    if ! check_dependencies; then
        exit 1
    fi
    
    check_postgres || print_warning "Continuing without PostgreSQL check..."
    
    echo ""
    
    # Parse command line arguments
    case "${1:-all}" in
        all|-a|"")
            run_all_tests
            ;;
        auth)
            run_auth_tests
            ;;
        fast|-f)
            print_info "Running tests (fast mode)..."
            pytest -q
            print_success "Tests completed!"
            ;;
        coverage|-c)
            run_with_coverage
            ;;
        watch|-w)
            run_watch_mode
            ;;
        verbose|-v)
            run_verbose
            ;;
        debug|-d)
            run_debug
            ;;
        failed|-lf)
            run_last_failed
            ;;
        help|-h|--help)
            usage
            ;;
        *)
            print_error "Unknown option: ${1}"
            echo ""
            usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

